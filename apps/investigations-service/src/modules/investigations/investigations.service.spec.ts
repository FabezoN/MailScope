import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import {
  InvestigationsService,
  INVESTIGATION_QUEUE,
} from './investigations.service';
import { Investigation, InvestigationStatus } from './entities/investigation.entity';
import { Report } from './entities/report.entity';
import { QueryInvestigationDto } from './dto/query-investigation.dto';

const mockInvestigationRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

const mockReportRepo = () => ({
  delete: jest.fn(),
});

const mockQueue = () => ({
  add: jest.fn(),
});

describe('InvestigationsService', () => {
  let service: InvestigationsService;
  let investigationRepo: ReturnType<typeof mockInvestigationRepo>;
  let reportRepo: ReturnType<typeof mockReportRepo>;
  let queue: ReturnType<typeof mockQueue>;

  beforeEach(async () => {
    investigationRepo = mockInvestigationRepo();
    reportRepo = mockReportRepo();
    queue = mockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestigationsService,
        { provide: getRepositoryToken(Investigation), useValue: investigationRepo },
        { provide: getRepositoryToken(Report), useValue: reportRepo },
        { provide: getQueueToken(INVESTIGATION_QUEUE), useValue: queue },
      ],
    }).compile();

    service = module.get<InvestigationsService>(InvestigationsService);
  });

  describe('create', () => {
    it('crée une investigation en BDD et enqueue un job "analyze"', async () => {
      const investigation = { id: 'uuid-1', email: 'test@gmail.com', userId: 'user-1', status: InvestigationStatus.PENDING };
      investigationRepo.create.mockReturnValue(investigation);
      investigationRepo.save.mockResolvedValue(investigation);
      queue.add.mockResolvedValue(undefined);

      const result = await service.create('test@gmail.com', 'user-1');

      expect(investigationRepo.create).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        userId: 'user-1',
        status: InvestigationStatus.PENDING,
      });
      expect(queue.add).toHaveBeenCalledWith('analyze', {
        investigationId: 'uuid-1',
        email: 'test@gmail.com',
      });
      expect(result).toEqual(investigation);
    });
  });

  describe('findAllByUser', () => {
    it('retourne toutes les investigations sans filtre', async () => {
      investigationRepo.find.mockResolvedValue([{ id: 'uuid-1' }]);

      await service.findAllByUser('user-1', {} as QueryInvestigationDto);

      expect(investigationRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('filtre par statut quand fourni', async () => {
      investigationRepo.find.mockResolvedValue([]);

      await service.findAllByUser('user-1', { status: InvestigationStatus.COMPLETED });

      expect(investigationRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', status: InvestigationStatus.COMPLETED },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('retourne l\'investigation quand elle existe', async () => {
      const investigation = { id: 'uuid-1', userId: 'user-1' };
      investigationRepo.findOne.mockResolvedValue(investigation);

      const result = await service.findOne('uuid-1', 'user-1');

      expect(investigationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1', userId: 'user-1' },
        relations: ['report'],
      });
      expect(result).toEqual(investigation);
    });

    it('lève NotFoundException si introuvable', async () => {
      investigationRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('supprime l\'investigation existante', async () => {
      const investigation = { id: 'uuid-1' };
      investigationRepo.findOne.mockResolvedValue(investigation);
      investigationRepo.remove.mockResolvedValue(undefined);

      await service.remove('uuid-1', 'user-1');

      expect(investigationRepo.remove).toHaveBeenCalledWith(investigation);
    });

    it('lève NotFoundException si introuvable', async () => {
      investigationRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('uuid-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('retry', () => {
    it('réinitialise et re-enqueue une investigation COMPLETED', async () => {
      const investigation = {
        id: 'uuid-1',
        email: 'test@gmail.com',
        userId: 'user-1',
        status: InvestigationStatus.COMPLETED,
      };
      investigationRepo.findOne
        .mockResolvedValueOnce(investigation)
        .mockResolvedValueOnce({ ...investigation, status: InvestigationStatus.PENDING });
      reportRepo.delete.mockResolvedValue(undefined);
      investigationRepo.update.mockResolvedValue(undefined);
      queue.add.mockResolvedValue(undefined);

      await service.retry('uuid-1', 'user-1');

      expect(reportRepo.delete).toHaveBeenCalledWith({ investigationId: 'uuid-1' });
      expect(investigationRepo.update).toHaveBeenCalledWith('uuid-1', {
        status: InvestigationStatus.PENDING,
        result: null,
        errorMessage: null,
      });
      expect(queue.add).toHaveBeenCalledWith('analyze', {
        investigationId: 'uuid-1',
        email: 'test@gmail.com',
      });
    });

    it('réinitialise et re-enqueue une investigation FAILED', async () => {
      investigationRepo.findOne
        .mockResolvedValueOnce({ id: 'uuid-1', email: 'test@gmail.com', status: InvestigationStatus.FAILED })
        .mockResolvedValueOnce({ id: 'uuid-1', status: InvestigationStatus.PENDING });
      reportRepo.delete.mockResolvedValue(undefined);
      investigationRepo.update.mockResolvedValue(undefined);
      queue.add.mockResolvedValue(undefined);

      await service.retry('uuid-1', 'user-1');

      expect(queue.add).toHaveBeenCalled();
    });

    it('lève BadRequestException si déjà PROCESSING', async () => {
      investigationRepo.findOne.mockResolvedValue({ id: 'uuid-1', status: InvestigationStatus.PROCESSING });

      await expect(service.retry('uuid-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si déjà PENDING', async () => {
      investigationRepo.findOne.mockResolvedValue({ id: 'uuid-1', status: InvestigationStatus.PENDING });

      await expect(service.retry('uuid-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('lève NotFoundException si introuvable', async () => {
      investigationRepo.findOne.mockResolvedValue(null);

      await expect(service.retry('uuid-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('met à jour le statut sans résultat ni erreur', async () => {
      const updated = { id: 'uuid-1', status: InvestigationStatus.PROCESSING };
      investigationRepo.update.mockResolvedValue(undefined);
      investigationRepo.findOne.mockResolvedValue(updated);

      const result = await service.updateStatus('uuid-1', InvestigationStatus.PROCESSING);

      expect(investigationRepo.update).toHaveBeenCalledWith('uuid-1', {
        status: InvestigationStatus.PROCESSING,
      });
      expect(result).toEqual(updated);
    });

    it('met à jour avec résultat quand fourni', async () => {
      investigationRepo.update.mockResolvedValue(undefined);
      investigationRepo.findOne.mockResolvedValue({ id: 'uuid-1' });

      await service.updateStatus('uuid-1', InvestigationStatus.COMPLETED, { score: 50 });

      expect(investigationRepo.update).toHaveBeenCalledWith('uuid-1', {
        status: InvestigationStatus.COMPLETED,
        result: { score: 50 },
      });
    });

    it('met à jour avec errorMessage quand fourni', async () => {
      investigationRepo.update.mockResolvedValue(undefined);
      investigationRepo.findOne.mockResolvedValue({ id: 'uuid-1' });

      await service.updateStatus('uuid-1', InvestigationStatus.FAILED, undefined, 'osint down');

      expect(investigationRepo.update).toHaveBeenCalledWith('uuid-1', {
        status: InvestigationStatus.FAILED,
        errorMessage: 'osint down',
      });
    });
  });
});
