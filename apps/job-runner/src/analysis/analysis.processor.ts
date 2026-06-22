import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { computeScore, HoleheEntry, LeakIXEntry } from '@mailscope/utils';

interface AnalysisJobData {
  investigationId: string;
  email: string;
}

interface OsintResult {
  email: string;
  domain: string;
  scannedAt: string;
  holehe: HoleheEntry[];
  leakix: LeakIXEntry[];
}

@Processor('email-analysis')
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<AnalysisJobData>): Promise<void> {
    const { investigationId, email } = job.data;
    const investigationsUrl = this.config.getOrThrow('INVESTIGATIONS_SERVICE_URL');
    const osintUrl = this.config.getOrThrow('OSINT_SERVICE_URL');

    const patch = (status: string, extra?: object) =>
      firstValueFrom(
        this.http.patch(`${investigationsUrl}/investigations/${investigationId}/status`, {
          status,
          ...extra,
        }),
      );

    try {
      await patch('PROCESSING');

      const startedAt = Date.now();
      const { data: osint } = await firstValueFrom(
        this.http.post<OsintResult>(`${osintUrl}/osint/email`, { email }),
      );

      const score = computeScore(osint.holehe ?? [], osint.leakix ?? []);

      await patch('COMPLETED', {
        result: { ...osint, durationMs: Date.now() - startedAt, score },
      });

      this.logger.log(`[${investigationId}] score=${score.value} level=${score.level}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`[${investigationId}] failed: ${errorMessage}`);
      await patch('FAILED', { errorMessage }).catch(() => {});
      throw err;
    }
  }
}
