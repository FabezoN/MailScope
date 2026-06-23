import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import { AnalyzeEmailDto } from './dto/analyze-email.dto';

interface HolehePlatform {
  platform: string;
  exists: boolean;
  emailRecovery: boolean;
  rateLimit: boolean;
}

export interface XonBreach {
  breach: string;
  domain: string;
  industry: string;
  passwordRisk: string;
  xposedData: string[];
  xposedDate: string;
  xposedRecords: number;
  verified: boolean;
}

interface XonApiResponse {
  ExposedBreaches: {
    breaches_details: Array<{
      breach: string;
      domain: string;
      industry: string;
      password_risk: string;
      xposed_data: string;
      xposed_date: string;
      xposed_records: number;
      verified: string;
    }>;
  } | null;
}

@Injectable()
export class OsintService {
  private readonly logger = new Logger(OsintService.name);

  private readonly scriptPath = path.join(process.cwd(), 'scripts', 'holehe_runner.py');
  private readonly python = process.env.PYTHON_PATH ?? 'python3';

  async analyze(dto: AnalyzeEmailDto) {
    const domain = dto.email.split('@')[1];
    const startedAt = Date.now();

    const [holehe, xon] = await Promise.all([
      this.runHolehe(dto.email),
      this.runXon(dto.email),
    ]);

    return {
      email: dto.email,
      domain,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      holehe,
      xon,
    };
  }

  private runHolehe(email: string): Promise<HolehePlatform[]> {
    return new Promise((resolve) => {
      this.logger.debug(`Spawning holehe for ${email} (${this.scriptPath})`);

      const child = spawn(this.python, [this.scriptPath, email], {
        timeout: 90_000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      child.on('close', (code) => {
        if (stderr) this.logger.warn(`holehe stderr: ${stderr.trim()}`);

        if (code !== 0 || !stdout.trim()) {
          this.logger.error(`holehe exited with code ${code}`);
          resolve([]);
          return;
        }

        try {
          const parsed: unknown = JSON.parse(stdout.trim());
          resolve(Array.isArray(parsed) ? (parsed as HolehePlatform[]) : []);
        } catch (err) {
          this.logger.error(`Failed to parse holehe output: ${err}`);
          resolve([]);
        }
      });

      child.on('error', (err) => {
        this.logger.error(`Failed to spawn holehe: ${err.message}`);
        resolve([]);
      });
    });
  }

  private async runXon(email: string): Promise<XonBreach[]> {
    const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'Accept': 'application/json' },
      });

      if (!res.ok) {
        this.logger.warn(`XposedOrNot returned ${res.status} for ${email}`);
        return [];
      }

      const data = await res.json() as XonApiResponse;
      const breaches = data.ExposedBreaches?.breaches_details ?? [];

      return breaches.map(b => ({
        breach: b.breach,
        domain: b.domain,
        industry: b.industry,
        passwordRisk: b.password_risk,
        xposedData: b.xposed_data.split(';').map(s => s.trim()).filter(Boolean),
        xposedDate: b.xposed_date,
        xposedRecords: b.xposed_records,
        verified: b.verified === 'Yes',
      }));
    } catch (err) {
      this.logger.warn(`XposedOrNot failed for ${email}: ${(err as Error).message}`);
      return [];
    }
  }
}
