import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
import { Investigation, InvestigationStatus } from '../entities/investigation.entity';
import { Report, RiskLevel, PlatformResult, LeakIXExposure } from '../entities/report.entity';

interface InvestigationJobData {
  investigationId: string;
  email: string;
}

interface OsintResult {
  email: string;
  domain: string;
  scannedAt: string;
  durationMs: number;
  holehe: PlatformResult[];
  leakix: LeakIXExposure[];
}

@Processor('investigation-queue')
export class InvestigationProcessor extends WorkerHost {
  private readonly logger = new Logger(InvestigationProcessor.name);

  constructor(
    @InjectRepository(Investigation)
    private readonly investigationRepo: Repository<Investigation>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<InvestigationJobData>): Promise<void> {
    const { investigationId, email } = job.data;
    const startedAt = Date.now();

    this.logger.log(`Traitement de l'investigation ${investigationId} pour ${email}`);

    await this.investigationRepo.update(investigationId, {
      status: InvestigationStatus.PROCESSING,
    });

    try {
      const osintUrl = this.configService.getOrThrow<string>('OSINT_SERVICE_URL');
      const { data } = await firstValueFrom(
        this.httpService.post<OsintResult>(`${osintUrl}/osint/email`, { email }),
      );

      const platforms = data.holehe ?? [];
      const leakixExposures = data.leakix ?? [];
      const accountsFound = platforms.filter((p) => p.exists).length;

      const rawScore = accountsFound * 10 + leakixExposures.length * 15;
      const globalScore = Math.min(rawScore, 100);

      const riskLevel = this.computeRiskLevel(globalScore);
      const recommendations = this.buildRecommendations(accountsFound, leakixExposures, riskLevel);

      const report = this.reportRepo.create({
        investigationId,
        email,
        domain: data.domain,
        globalScore,
        riskLevel,
        accountsFound,
        platforms,
        leakixExposures,
        recommendations,
        durationMs: Date.now() - startedAt,
      });
      await this.reportRepo.save(report);

      await this.investigationRepo.update(investigationId, {
        status: InvestigationStatus.COMPLETED,
        result: data as unknown as Record<string, unknown>,
      });

      this.logger.log(`Investigation ${investigationId} complétée — score: ${globalScore}, risque: ${riskLevel}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      this.logger.error(`Investigation ${investigationId} échouée: ${message}`);

      await this.investigationRepo.update(investigationId, {
        status: InvestigationStatus.FAILED,
        errorMessage: message,
      });
    }
  }

  private computeRiskLevel(score: number): RiskLevel {
    if (score < 25) return RiskLevel.LOW;
    if (score < 50) return RiskLevel.MEDIUM;
    if (score < 75) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  private buildRecommendations(
    accountsFound: number,
    leakixExposures: LeakIXExposure[],
    riskLevel: RiskLevel,
  ): string[] {
    const recs: string[] = [];

    if (accountsFound > 0) {
      recs.push(
        `Votre email est enregistré sur ${accountsFound} plateforme(s). Changez votre mot de passe sur chacune d'elles.`,
      );
    }

    if (leakixExposures.length > 0) {
      const highSeverity = leakixExposures.filter((e) => e.severity === 'high' || e.severity === 'critical');
      recs.push(
        `${leakixExposures.length} service(s) exposé(s) détecté(s) sur votre domaine.` +
          (highSeverity.length > 0 ? ` Dont ${highSeverity.length} de sévérité haute/critique.` : ''),
      );
    }

    if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      recs.push("Activez l'authentification à deux facteurs (2FA) sur vos comptes sensibles.");
      recs.push('Envisagez d\'utiliser un gestionnaire de mots de passe pour renforcer votre sécurité.');
    }

    if (recs.length === 0) {
      recs.push('Aucune exposition critique détectée. Continuez à surveiller régulièrement votre empreinte numérique.');
    }

    return recs;
  }
}
