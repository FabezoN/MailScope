import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthScheduler {
  private readonly logger = new Logger(HealthScheduler.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Interval(30_000)
  async pingDatabase(): Promise<void> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database ping OK');
    } catch (err) {
      this.logger.error('Database ping FAILED', err instanceof Error ? err.message : err);
    }
  }

  @Interval(30_000)
  async pingOsintService(): Promise<void> {
    const baseUrl = this.configService.getOrThrow('OSINT_SERVICE_URL');
    try {
      await firstValueFrom(this.httpService.get(`${baseUrl}/health`));
      this.logger.log('osint-service ping OK');
    } catch (err) {
      this.logger.error('osint-service ping FAILED', err instanceof Error ? err.message : err);
    }
  }
}
