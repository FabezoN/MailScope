import { Injectable } from '@nestjs/common';
import { AnalyzeEmailDto } from './dto/analyze-email.dto';

@Injectable()
export class OsintService {
  analyze(dto: AnalyzeEmailDto) {
    const domain = dto.email.split('@')[1];
    const startedAt = Date.now();

    return {
      email: dto.email,
      domain,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      holehe: [
        { platform: 'twitter',   exists: true,  emailRecovery: true,  rateLimit: false },
        { platform: 'instagram', exists: true,  emailRecovery: false, rateLimit: false },
        { platform: 'github',    exists: false, emailRecovery: false, rateLimit: false },
        { platform: 'spotify',   exists: true,  emailRecovery: true,  rateLimit: false },
        { platform: 'linkedin',  exists: false, emailRecovery: false, rateLimit: true  },
      ],
      leakix: [
        {
          host:     domain,
          ip:       '93.184.216.34',
          port:     443,
          protocol: 'https',
          service:  'nginx/1.18.0',
          severity: 'medium',
        },
        {
          host:     domain,
          ip:       '93.184.216.34',
          port:     80,
          protocol: 'http',
          service:  'nginx/1.18.0',
          severity: 'low',
        },
      ],
    };
  }
}
