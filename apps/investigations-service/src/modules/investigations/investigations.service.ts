import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Investigation, InvestigationStatus } from './entities/investigation.entity';

@Injectable()
export class InvestigationsService {
  constructor(
    @InjectRepository(Investigation)
    private readonly repo: Repository<Investigation>,
    @InjectQueue('email-analysis')
    private readonly queue: Queue,
  ) {}

  async create(email: string, userId: string) {
    const investigation = await this.repo.save(
      this.repo.create({ email, userId, status: InvestigationStatus.PENDING }),
    );
    await this.queue.add('analyze', { investigationId: investigation.id, email });
    return investigation;
  }

  findAllByUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findOne(id: string, userId: string) {
    return this.repo.findOne({ where: { id, userId } });
  }

  async updateStatus(
    id: string,
    status: InvestigationStatus,
    result?: Record<string, unknown>,
    errorMessage?: string,
  ) {
    await this.repo.update(id, {
      status,
      ...(result !== undefined && { result }),
      ...(errorMessage !== undefined && { errorMessage }),
    });
    return this.repo.findOne({ where: { id } });
  }
}
