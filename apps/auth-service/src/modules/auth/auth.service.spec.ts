import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';

jest.mock('bcryptjs');

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let users: ReturnType<typeof mockUserRepo>;
  let jwt: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    users = mockUserRepo();
    jwt = mockJwtService();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('crée un utilisateur et retourne un token quand l\'email est libre', async () => {
      users.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      const created = { id: 'user-1', email: 'a@a.com', password: 'hashed-pw', role: UserRole.USER };
      users.create.mockReturnValue(created);
      users.save.mockResolvedValue(created);
      jwt.sign.mockReturnValue('jwt-token');

      const result = await service.register({ email: 'a@a.com', password: 'plain1234' });

      expect(bcrypt.hash).toHaveBeenCalledWith('plain1234', 10);
      expect(users.create).toHaveBeenCalledWith({ email: 'a@a.com', password: 'hashed-pw' });
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: { id: 'user-1', email: 'a@a.com', role: UserRole.USER },
      });
    });

    it('lève ConflictException si l\'email existe déjà', async () => {
      users.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.register({ email: 'a@a.com', password: 'plain1234' })).rejects.toThrow(
        ConflictException,
      );
      expect(users.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('retourne un token quand les identifiants sont valides', async () => {
      const user = { id: 'user-1', email: 'a@a.com', password: 'hashed-pw', role: UserRole.USER };
      users.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token');

      const result = await service.login({ email: 'a@a.com', password: 'plain1234' });

      expect(bcrypt.compare).toHaveBeenCalledWith('plain1234', 'hashed-pw');
      expect(result.access_token).toBe('jwt-token');
    });

    it('lève UnauthorizedException si l\'utilisateur est introuvable', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.login({ email: 'a@a.com', password: 'plain1234' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lève UnauthorizedException si le mot de passe est invalide', async () => {
      users.findOne.mockResolvedValue({ id: 'user-1', password: 'hashed-pw' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'a@a.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('met à jour le mot de passe quand l\'ancien est correct', async () => {
      users.findOne.mockResolvedValue({ id: 'user-1', password: 'old-hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      await service.changePassword('user-1', 'old-pw', 'new-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('old-pw', 'old-hashed');
      expect(users.update).toHaveBeenCalledWith('user-1', { password: 'new-hashed' });
    });

    it('lève NotFoundException si l\'utilisateur est introuvable', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.changePassword('user-1', 'old-pw', 'new-password')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève UnauthorizedException si l\'ancien mot de passe est incorrect', async () => {
      users.findOne.mockResolvedValue({ id: 'user-1', password: 'old-hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-1', 'wrong-pw', 'new-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(users.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('supprime l\'utilisateur existant', async () => {
      const user = { id: 'user-1' };
      users.findOne.mockResolvedValue(user);

      await service.deleteAccount('user-1');

      expect(users.remove).toHaveBeenCalledWith(user);
    });

    it('lève NotFoundException si l\'utilisateur est introuvable', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
