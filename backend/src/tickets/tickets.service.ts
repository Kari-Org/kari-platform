import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserRole } from '@kari/types';
import type { CreateTicketDto } from './dto/create-ticket.dto';
import type { UpdateTicketDto } from './dto/update-ticket.dto';
import { SupportTicket, TicketStatus } from './entities/ticket.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(SupportTicket) private readonly repo: Repository<SupportTicket>,
  ) {}

  create(requesterId: string, requesterRole: UserRole, dto: CreateTicketDto) {
    return this.repo.save(
      this.repo.create({
        requesterId,
        requesterRole,
        subject: dto.subject,
        message: dto.message,
        category: dto.category,
        rideId: dto.rideId ?? null,
        status: TicketStatus.OPEN,
      }),
    );
  }

  mine(requesterId: string) {
    return this.repo.find({ where: { requesterId }, order: { createdAt: 'DESC' } });
  }

  async list(params: { page: number; limit: number; status?: TicketStatus }) {
    const { page, limit, status } = params;
    const [items, total] = await this.repo.findAndCount({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async update(id: string, adminId: string, dto: UpdateTicketDto) {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('ticket not found');
    if (dto.reply !== undefined) {
      ticket.adminReply = dto.reply;
      ticket.handledById = adminId;
      if (!dto.status) ticket.status = TicketStatus.IN_PROGRESS;
    }
    if (dto.status) ticket.status = dto.status;
    return this.repo.save(ticket);
  }
}
