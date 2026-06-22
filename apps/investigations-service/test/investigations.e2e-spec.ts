import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { InvestigationsController } from '../src/modules/investigations/investigations.controller';
import { InvestigationsService, INVESTIGATION_QUEUE } from '../src/modules/investigations/investigations.service';
import { Investigation, InvestigationStatus } from '../src/modules/investigations/entities/investigation.entity';
import { Report } from '../src/modules/investigations/entities/report.entity';

const USER_ID = 'user-test-e2e';

const makeInvestigation = (overrides = {}): Partial<Investigation> => ({
  id: 'uuid-e2e',
  email: 'test@gmail.com',
  userId: USER_ID,
  status: InvestigationStatus.PENDING,
  result: null,
  errorMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Investigations (e2e)', () => {
  let app: INestApplication;
  let investigationRepo: Record<string, jest.Mock>;
  let reportRepo: Record<string, jest.Mock>;
  let queue: Record<string, jest.Mock>;

  beforeEach(async () => {
    investigationRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    reportRepo = { delete: jest.fn() };
    queue = { add: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [InvestigationsController],
      providers: [
        InvestigationsService,
        { provide: getRepositoryToken(Investigation), useValue: investigationRepo },
        { provide: getRepositoryToken(Report), useValue: reportRepo },
        { provide: getQueueToken(INVESTIGATION_QUEUE), useValue: queue },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(() => app.close());

  describe('POST /investigations', () => {
    it('retourne 201 avec l\'investigation en PENDING', async () => {
      const investigation = makeInvestigation();
      investigationRepo.create.mockReturnValue(investigation);
      investigationRepo.save.mockResolvedValue(investigation);
      queue.add.mockResolvedValue(undefined);

      const { status, body } = await request(app.getHttpServer())
        .post('/investigations')
        .set('x-user-id', USER_ID)
        .send({ email: 'test@gmail.com' });

      expect(status).toBe(201);
      expect(body.status).toBe(InvestigationStatus.PENDING);
      expect(queue.add).toHaveBeenCalledWith('analyze', expect.objectContaining({ email: 'test@gmail.com' }));
    });

    it('retourne 400 si l\'email est invalide', async () => {
      const { status } = await request(app.getHttpServer())
        .post('/investigations')
        .set('x-user-id', USER_ID)
        .send({ email: 'not-an-email' });

      expect(status).toBe(400);
    });
  });

  describe('GET /investigations', () => {
    it('retourne la liste des investigations de l\'utilisateur', async () => {
      const investigations = [makeInvestigation(), makeInvestigation({ id: 'uuid-2' })];
      investigationRepo.find.mockResolvedValue(investigations);

      const { status, body } = await request(app.getHttpServer())
        .get('/investigations')
        .set('x-user-id', USER_ID);

      expect(status).toBe(200);
      expect(body).toHaveLength(2);
    });

    it('filtre par statut via query param', async () => {
      investigationRepo.find.mockResolvedValue([makeInvestigation({ status: InvestigationStatus.COMPLETED })]);

      const { status, body } = await request(app.getHttpServer())
        .get('/investigations?status=COMPLETED')
        .set('x-user-id', USER_ID);

      expect(status).toBe(200);
      expect(body[0].status).toBe(InvestigationStatus.COMPLETED);
    });
  });

  describe('GET /investigations/:id', () => {
    it('retourne l\'investigation', async () => {
      investigationRepo.findOne.mockResolvedValue(makeInvestigation());

      const { status, body } = await request(app.getHttpServer())
        .get('/investigations/uuid-e2e')
        .set('x-user-id', USER_ID);

      expect(status).toBe(200);
      expect(body.id).toBe('uuid-e2e');
    });

    it('retourne 404 si introuvable', async () => {
      investigationRepo.findOne.mockResolvedValue(null);

      const { status } = await request(app.getHttpServer())
        .get('/investigations/unknown')
        .set('x-user-id', USER_ID);

      expect(status).toBe(404);
    });
  });

  describe('PATCH /investigations/:id/status', () => {
    it('met à jour le statut en COMPLETED avec un résultat', async () => {
      const updated = makeInvestigation({ status: InvestigationStatus.COMPLETED, result: { score: 54 } });
      investigationRepo.update.mockResolvedValue(undefined);
      investigationRepo.findOne.mockResolvedValue(updated);

      const { status, body } = await request(app.getHttpServer())
        .patch('/investigations/uuid-e2e/status')
        .send({ status: 'COMPLETED', result: { score: 54 } });

      expect(status).toBe(200);
      expect(body.status).toBe(InvestigationStatus.COMPLETED);
    });

    it('retourne 400 si le statut est invalide', async () => {
      const { status } = await request(app.getHttpServer())
        .patch('/investigations/uuid-e2e/status')
        .send({ status: 'INVALID_STATUS' });

      expect(status).toBe(400);
    });
  });

  describe('POST /investigations/:id/retry', () => {
    it('re-enqueue une investigation FAILED', async () => {
      const investigation = makeInvestigation({ status: InvestigationStatus.FAILED });
      investigationRepo.findOne
        .mockResolvedValueOnce(investigation)
        .mockResolvedValueOnce(makeInvestigation());
      reportRepo.delete.mockResolvedValue(undefined);
      investigationRepo.update.mockResolvedValue(undefined);
      queue.add.mockResolvedValue(undefined);

      const { status } = await request(app.getHttpServer())
        .post('/investigations/uuid-e2e/retry')
        .set('x-user-id', USER_ID);

      expect(status).toBe(201);
      expect(queue.add).toHaveBeenCalled();
    });

    it('retourne 400 si déjà PROCESSING', async () => {
      investigationRepo.findOne.mockResolvedValue(makeInvestigation({ status: InvestigationStatus.PROCESSING }));

      const { status } = await request(app.getHttpServer())
        .post('/investigations/uuid-e2e/retry')
        .set('x-user-id', USER_ID);

      expect(status).toBe(400);
    });
  });

  describe('DELETE /investigations/:id', () => {
    it('retourne 204 après suppression', async () => {
      investigationRepo.findOne.mockResolvedValue(makeInvestigation());
      investigationRepo.remove.mockResolvedValue(undefined);

      const { status } = await request(app.getHttpServer())
        .delete('/investigations/uuid-e2e')
        .set('x-user-id', USER_ID);

      expect(status).toBe(204);
    });

    it('retourne 404 si introuvable', async () => {
      investigationRepo.findOne.mockResolvedValue(null);

      const { status } = await request(app.getHttpServer())
        .delete('/investigations/unknown')
        .set('x-user-id', USER_ID);

      expect(status).toBe(404);
    });
  });
});
