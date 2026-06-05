import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VOICE_PROVIDER, type VoiceProvider } from '../providers/contracts';
import { RealtimeService } from '../realtime/realtime.service';
import { Ride } from '../rides/entities/ride.entity';
import { User } from '../users/entities/user.entity';
import { ChatMessage } from './entities/chat-message.entity';

/**
 * In-ride communication: persisted chat (delivered live over the socket) and
 * masked voice calls (via VoiceProvider — real numbers never exposed). Both are
 * gated to the two ride participants.
 */
@Injectable()
export class CommsService {
  constructor(
    @InjectRepository(ChatMessage) private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Ride) private readonly rides: Repository<Ride>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(VOICE_PROVIDER) private readonly voice: VoiceProvider,
    private readonly realtime: RealtimeService,
  ) {}

  /** Verify the user is on the ride and return the counterparty. */
  private async counterparty(userId: string, rideId: string): Promise<{ ride: Ride; otherId: string }> {
    const ride = await this.rides.findOne({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('ride not found');
    if (ride.riderId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('not a participant in this ride');
    }
    const otherId = ride.riderId === userId ? ride.driverId : ride.riderId;
    if (!otherId) throw new BadRequestException('no counterparty on this ride yet');
    return { ride, otherId };
  }

  async send(senderId: string, rideId: string, body: string) {
    const { otherId } = await this.counterparty(senderId, rideId);
    const msg = await this.messages.save(
      this.messages.create({ rideId, senderId, recipientId: otherId, body }),
    );
    this.realtime.emitToUser(otherId, 'chat:message', {
      id: msg.id,
      rideId,
      senderId,
      body,
      at: msg.createdAt,
    });
    return msg;
  }

  async history(userId: string, rideId: string) {
    await this.counterparty(userId, rideId);
    return this.messages.find({ where: { rideId }, order: { createdAt: 'ASC' }, take: 200 });
  }

  async maskedCall(callerId: string, rideId: string) {
    const { otherId } = await this.counterparty(callerId, rideId);
    const [caller, callee] = await Promise.all([
      this.users.findOne({ where: { id: callerId } }),
      this.users.findOne({ where: { id: otherId } }),
    ]);
    if (!caller?.phone || !callee?.phone) {
      throw new BadRequestException('both parties need a phone number to connect a call');
    }
    const session = await this.voice.connectMaskedCall({
      fromNumber: caller.phone,
      toNumber: callee.phone,
      reference: rideId,
    });
    return { proxyNumber: session.proxyNumber, sessionId: session.sessionId, provider: session.provider };
  }
}
