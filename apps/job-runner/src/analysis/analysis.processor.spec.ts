import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AnalysisProcessor } from './analysis.processor';

const INVESTIGATIONS_URL = 'http://investigations-service:3003';
const OSINT_URL = 'http://osint-service:3000';

const osintResult = {
  email: 'test@gmail.com',
  domain: 'gmail.com',
  scannedAt: new Date().toISOString(),
  holehe: [
    { exists: true, platform: 'twitter', rateLimit: false, emailRecovery: true },
    { exists: true, platform: 'instagram', rateLimit: false, emailRecovery: false },
  ],
  leakix: [
    { ip: '1.2.3.4', host: 'gmail.com', port: 443, service: 'nginx', protocol: 'https', severity: 'medium' },
  ],
};

describe('AnalysisProcessor', () => {
  let processor: AnalysisProcessor;
  let httpService: jest.Mocked<Pick<HttpService, 'patch' | 'post'>>;

  beforeEach(async () => {
    httpService = {
      patch: jest.fn(),
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisProcessor,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'INVESTIGATIONS_SERVICE_URL') return INVESTIGATIONS_URL;
              if (key === 'OSINT_SERVICE_URL') return OSINT_URL;
              throw new Error(`Missing config: ${key}`);
            },
          },
        },
      ],
    }).compile();

    processor = module.get<AnalysisProcessor>(AnalysisProcessor);
  });

  const makeJob = (data = { investigationId: 'uuid-1', email: 'test@gmail.com' }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ data } as any);

  describe('process (succès)', () => {
    beforeEach(() => {
      (httpService.patch as jest.Mock).mockReturnValue(of({ data: {} }));
      (httpService.post as jest.Mock).mockReturnValue(of({ data: osintResult }));
    });

    it('passe le statut en PROCESSING avant d\'appeler l\'osint-service', async () => {
      await processor.process(makeJob());

      expect(httpService.patch).toHaveBeenNthCalledWith(
        1,
        `${INVESTIGATIONS_URL}/investigations/uuid-1/status`,
        { status: 'PROCESSING' },
      );
    });

    it('appelle l\'osint-service avec l\'email du job', async () => {
      await processor.process(makeJob());

      expect(httpService.post).toHaveBeenCalledWith(
        `${OSINT_URL}/osint/email`,
        { email: 'test@gmail.com' },
      );
    });

    it('passe le statut en COMPLETED avec le résultat et le score calculé', async () => {
      await processor.process(makeJob());

      const [, body] = (httpService.patch as jest.Mock).mock.calls[1];
      expect(body.status).toBe('COMPLETED');
      expect(body.result).toMatchObject({
        email: 'test@gmail.com',
        holehe: osintResult.holehe,
        leakix: osintResult.leakix,
        score: expect.objectContaining({
          value: expect.any(Number),
          level: expect.any(String),
        }),
      });
    });
  });

  describe('process (échec)', () => {
    it('passe le statut en FAILED si l\'osint-service échoue', async () => {
      (httpService.patch as jest.Mock).mockReturnValue(of({ data: {} }));
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('osint service unavailable')),
      );

      await expect(processor.process(makeJob())).rejects.toThrow('osint service unavailable');

      expect(httpService.patch).toHaveBeenCalledWith(
        `${INVESTIGATIONS_URL}/investigations/uuid-1/status`,
        expect.objectContaining({ status: 'FAILED', errorMessage: 'osint service unavailable' }),
      );
    });

    it('re-lève l\'erreur après avoir patché FAILED', async () => {
      (httpService.patch as jest.Mock).mockReturnValue(of({ data: {} }));
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('timeout')),
      );

      await expect(processor.process(makeJob())).rejects.toThrow('timeout');
    });
  });
});
