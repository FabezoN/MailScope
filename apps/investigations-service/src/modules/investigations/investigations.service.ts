import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Investigation, InvestigationStatus } from './entities/investigation.entity';

@Injectable()
export class InvestigationsService {
  private readonly logger = new Logger(InvestigationsService.name);

  constructor(
    @InjectRepository(Investigation)
    private readonly repo: Repository<Investigation>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(email: string, userId: string) {
    const investigation = await this.repo.save(
      this.repo.create({ email, userId, status: InvestigationStatus.PENDING }),
    );

    // run analysis synchronously for now (job-runner will handle async later)
    try {
      await this.repo.update(investigation.id, { status: InvestigationStatus.PROCESSING });

      const osintUrl = this.configService.getOrThrow('OSINT_SERVICE_URL');
      const { data } = await firstValueFrom(
        this.httpService.post(`${osintUrl}/osint/email`, { email }),
      );

      await this.repo.update(investigation.id, {
        status: InvestigationStatus.COMPLETED,
        result: data,
      });

      return this.repo.findOne({ where: { id: investigation.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Investigation ${investigation.id} failed: ${message}`);
      await this.repo.update(investigation.id, {
        status: InvestigationStatus.FAILED,
        errorMessage: message,
      });
      return this.repo.findOne({ where: { id: investigation.id } });
    }
  }

  findAllByUser(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string, userId: string) {
    return this.repo.findOne({ where: { id, userId } });
  }
}
