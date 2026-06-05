import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  record(entry: Partial<AuditLog>): Promise<AuditLog> {
    return this.repo.save(this.repo.create(entry));
  }

  async list(params: { page: number; limit: number; action?: string }) {
    const { page, limit, action } = params;
    const [items, total] = await this.repo.findAndCount({
      where: action ? { action } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }
}
