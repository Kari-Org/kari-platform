import { randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationChannel, PanicStatus } from '@kari/types';
import { DriverService } from '../driver/driver.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Ride } from '../rides/entities/ride.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { PanicEvent } from './entities/panic-event.entity';
import { SharedTrip } from './entities/shared-trip.entity';

const SHARE_TTL_HOURS = 12;

/**
 * Trust & safety: emergency contacts, a panic/SOS alert that notifies those
 * contacts + ops, and a revocable public link that exposes a ride's live status
 * read-only (no PIN, no rider PII).
 */
@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    @InjectRepository(EmergencyContact) private readonly contacts: Repository<EmergencyContact>,
    @InjectRepository(PanicEvent) private readonly panics: Repository<PanicEvent>,
    @InjectRepository(SharedTrip) private readonly shares: Repository<SharedTrip>,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    private readonly drivers: DriverService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  // ─── emergency contacts ──────────────────────────────────────────────────────
  addContact(userId: string, dto: { name: string; phone: string; relationship?: string }) {
    return this.contacts.save(
      this.contacts.create({ userId, name: dto.name, phone: dto.phone, relationship: dto.relationship ?? null }),
    );
  }

  listContacts(userId: string) {
    return this.contacts.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async removeContact(userId: string, id: string) {
    const contact = await this.contacts.findOne({ where: { id, userId } });
    if (!contact) throw new NotFoundException('contact not found');
    await this.contacts.remove(contact);
    return { removed: true };
  }

  // ─── panic ───────────────────────────────────────────────────────────────────
  async panic(userId: string, dto: { rideId?: string; lat: number; lng: number }) {
    const contacts = await this.listContacts(userId);
    const event = await this.panics.save(
      this.panics.create({
        userId,
        rideId: dto.rideId ?? null,
        lat: dto.lat,
        lng: dto.lng,
        status: PanicStatus.OPEN,
        contactsAlerted: contacts.length,
      }),
    );

    const mapLink = `https://maps.google.com/?q=${dto.lat},${dto.lng}`;
    for (const c of contacts) {
      await this.notifications.sendSms(
        c.phone,
        `Kari SOS: your emergency contact ${c.name} may need help. Last known location: ${mapLink}`,
      );
    }
    // Confirm to the user in-app + alert ops + the assigned driver if mid-ride.
    await this.notifications.notify(userId, {
      type: 'panic',
      title: 'Panic alert sent',
      body: `We've alerted your ${contacts.length} emergency contact${contacts.length === 1 ? '' : 's'} and our safety team.`,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
    this.realtime.emitToRoom('ops', 'safety:panic', { eventId: event.id, userId, ...dto });
    if (dto.rideId) {
      const ride = await this.rides.findOne({ where: { id: dto.rideId } });
      const otherId = ride ? (ride.riderId === userId ? ride.driverId : ride.riderId) : null;
      if (otherId) this.realtime.emitToUser(otherId, 'safety:panic', { rideId: dto.rideId, lat: dto.lat, lng: dto.lng });
    }
    this.logger.warn(`PANIC raised by ${userId} (ride ${dto.rideId ?? 'none'}) — ${contacts.length} contacts alerted`);
    return event;
  }

  async resolvePanic(userId: string, eventId: string) {
    const event = await this.panics.findOne({ where: { id: eventId, userId } });
    if (!event) throw new NotFoundException('panic event not found');
    event.status = PanicStatus.RESOLVED;
    event.resolvedAt = new Date();
    return this.panics.save(event);
  }

  // ─── share trip ──────────────────────────────────────────────────────────────
  private async ensureParticipant(userId: string, rideId: string): Promise<Ride> {
    const ride = await this.rides.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('ride not found');
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('not a participant in this ride');
    }
    return ride;
  }

  async share(userId: string, rideId: string) {
    await this.ensureParticipant(userId, rideId);
    // Reuse an existing active share for this ride if present.
    const existing = await this.shares.findOne({ where: { rideId, createdBy: userId, active: true } });
    if (existing && existing.expiresAt > new Date()) {
      return this.shapeShare(existing);
    }
    const share = await this.shares.save(
      this.shares.create({
        rideId,
        token: randomBytes(24).toString('hex'),
        createdBy: userId,
        expiresAt: new Date(Date.now() + SHARE_TTL_HOURS * 3_600_000),
        active: true,
      }),
    );
    return this.shapeShare(share);
  }

  async stopShare(userId: string, rideId: string) {
    const shares = await this.shares.find({ where: { rideId, createdBy: userId, active: true } });
    for (const s of shares) {
      s.active = false;
      await this.shares.save(s);
    }
    return { stopped: shares.length };
  }

  /** Public, read-only ride status for a share token — no PIN, no rider PII. */
  async resolveShared(token: string) {
    const share = await this.shares.findOne({ where: { token, active: true } });
    if (!share || share.expiresAt <= new Date()) {
      throw new NotFoundException('this trip link is invalid or has expired');
    }
    const ride = await this.rides.findOne({ where: { id: share.rideId } });
    if (!ride) throw new NotFoundException('ride not found');
    let driver: { name: string; vehicle: unknown } | null = null;
    if (ride.driverId) {
      const d = await this.drivers.findByUser(ride.driverId);
      if (d) {
        driver = {
          name: [d.firstName, d.lastName].filter(Boolean).join(' ') || 'Your driver',
          vehicle: d.vehicle
            ? { brand: d.vehicle.brand, model: d.vehicle.model, color: d.vehicle.color, plateNumber: d.vehicle.plateNumber }
            : null,
        };
      }
    }
    return {
      status: ride.status,
      pickupAddress: ride.pickupAddress,
      dropoffAddress: ride.dropoffAddress,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
      carCategory: ride.carCategory,
      driver,
      etaSeconds: ride.durationSeconds,
      expiresAt: share.expiresAt,
    };
  }

  private shapeShare(share: SharedTrip) {
    return {
      token: share.token,
      rideId: share.rideId,
      url: `/trips/shared/${share.token}`,
      expiresAt: share.expiresAt,
      active: share.active,
    };
  }
}
