import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { Investigation, InvestigationStatus } from './entities/investigation.entity';
import { Report } from './entities/report.entity';
import { QueryInvestigationDto } from './dto/query-investigation.dto';

export const INVESTIGATION_QUEUE = 'email-analysis';

@Injectable()
export class InvestigationsService {
  private readonly logger = new Logger(InvestigationsService.name);

  constructor(
    @InjectRepository(Investigation)
    private readonly investigationRepo: Repository<Investigation>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectQueue(INVESTIGATION_QUEUE)
    private readonly queue: Queue,
  ) {}

  async create(email: string, userId: string): Promise<Investigation> {
    const investigation = await this.investigationRepo.save(
      this.investigationRepo.create({ email, userId, status: InvestigationStatus.PENDING }),
    );

    await this.queue.add('analyze', {
      investigationId: investigation.id,
      email,
    });

    this.logger.log(`Investigation ${investigation.id} created and enqueued`);
    return investigation;
  }

  findAllByUser(userId: string, query: QueryInvestigationDto): Promise<Investigation[]> {
    return this.investigationRepo.find({
      where: { userId, ...(query.status && { status: query.status }) },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Investigation> {
    const investigation = await this.investigationRepo.findOne({
      where: { id, userId },
      relations: ['report'],
    });
    if (!investigation) throw new NotFoundException('Investigation introuvable');
    return investigation;
  }

  async remove(id: string, userId: string): Promise<void> {
    const investigation = await this.investigationRepo.findOne({ where: { id, userId } });
    if (!investigation) throw new NotFoundException('Investigation introuvable');
    await this.investigationRepo.remove(investigation);
  }

  async retry(id: string, userId: string): Promise<Investigation> {
    const investigation = await this.investigationRepo.findOne({ where: { id, userId } });
    if (!investigation) throw new NotFoundException('Investigation introuvable');

    if (investigation.status === InvestigationStatus.PROCESSING) {
      throw new BadRequestException("L'investigation est déjà en cours de traitement");
    }
    if (investigation.status === InvestigationStatus.PENDING) {
      throw new BadRequestException("L'investigation est déjà en attente");
    }

    await this.reportRepo.delete({ investigationId: id });

    await this.investigationRepo.update(id, {
      status: InvestigationStatus.PENDING,
      result: null,
      errorMessage: null,
    });

    await this.queue.add('analyze', {
      investigationId: id,
      email: investigation.email,
    });

    this.logger.log(`Investigation ${id} relancée`);
    return this.investigationRepo.findOne({ where: { id, userId } }) as Promise<Investigation>;
  }

  async updateStatus(
    id: string,
    status: InvestigationStatus,
    result?: Record<string, unknown>,
    errorMessage?: string,
  ) {
    const patch: Partial<Investigation> = { status };
    if (result !== undefined) patch.result = result;
    if (errorMessage !== undefined) patch.errorMessage = errorMessage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.investigationRepo.update(id, patch as any);
    return this.investigationRepo.findOne({ where: { id } });
  }
}
