import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthScheduler {
  private readonly logger = new Logger(HealthScheduler.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Interval(30_000)
  async pingServices(): Promise<void> {
    const services: Record<string, string | undefined> = {
      'auth-service': this.configService.get('AUTH_SERVICE_URL'),
      'osint-service': this.configService.get('OSINT_SERVICE_URL'),
      'investigations-service': this.configService.get('INVESTIGATIONS_SERVICE_URL'),
    };

    for (const [name, url] of Object.entries(services)) {
      if (!url) continue;
      try {
        await firstValueFrom(this.httpService.get(`${url}/health`));
        this.logger.log(`${name} ping OK`);
      } catch {
        this.logger.error(`${name} ping FAILED`);
      }
    }
  }
}
