import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AuthProxyController } from './auth-proxy.controller';

const AUTH_URL = 'http://auth-service:3002';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRequest = (user = { id: 'user-1', email: 'a@a.com', role: 'USER' }) => ({ user }) as any;

describe('AuthProxyController', () => {
  let controller: AuthProxyController;
  let httpService: jest.Mocked<Pick<HttpService, 'post' | 'patch' | 'delete'>>;

  beforeEach(async () => {
    httpService = { post: jest.fn(), patch: jest.fn(), delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthProxyController],
      providers: [
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { getOrThrow: () => AUTH_URL } },
      ],
    }).compile();

    controller = module.get<AuthProxyController>(AuthProxyController);
  });

  describe('register', () => {
    it('relaie la réponse de auth-service', async () => {
      (httpService.post as jest.Mock).mockReturnValue(of({ data: { access_token: 'tok' } }));

      const result = await controller.register({ email: 'a@a.com', password: 'plain1234' });

      expect(httpService.post).toHaveBeenCalledWith(`${AUTH_URL}/auth/register`, {
        email: 'a@a.com',
        password: 'plain1234',
      });
      expect(result).toEqual({ access_token: 'tok' });
    });

    it('propage le statut et le corps d\'erreur renvoyés par auth-service', async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => ({
          isAxiosError: true,
          response: { status: 409, data: { message: 'Email already in use' } },
        })),
      );

      await expect(
        controller.register({ email: 'a@a.com', password: 'plain1234' }),
      ).rejects.toThrow(HttpException);
    });

    it('lève ServiceUnavailableException si auth-service est injoignable', async () => {
      (httpService.post as jest.Mock).mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

      await expect(
        controller.register({ email: 'a@a.com', password: 'plain1234' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('login', () => {
    it('relaie la réponse de auth-service', async () => {
      (httpService.post as jest.Mock).mockReturnValue(of({ data: { access_token: 'tok' } }));

      const result = await controller.login({ email: 'a@a.com', password: 'plain1234' });

      expect(httpService.post).toHaveBeenCalledWith(`${AUTH_URL}/auth/login`, {
        email: 'a@a.com',
        password: 'plain1234',
      });
      expect(result).toEqual({ access_token: 'tok' });
    });
  });

  describe('changePassword', () => {
    it('transmet x-user-id en header vers auth-service', async () => {
      (httpService.patch as jest.Mock).mockReturnValue(of({ data: {} }));

      await controller.changePassword(
        { currentPassword: 'old-pw', newPassword: 'new-password' },
        makeRequest(),
      );

      expect(httpService.patch).toHaveBeenCalledWith(
        `${AUTH_URL}/auth/me/password`,
        { currentPassword: 'old-pw', newPassword: 'new-password' },
        { headers: { 'x-user-id': 'user-1' } },
      );
    });

    it('lève ServiceUnavailableException si auth-service est injoignable', async () => {
      (httpService.patch as jest.Mock).mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

      await expect(
        controller.changePassword({ currentPassword: 'old-pw', newPassword: 'new-password' }, makeRequest()),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('deleteAccount', () => {
    it('transmet x-user-id en header vers auth-service', async () => {
      (httpService.delete as jest.Mock).mockReturnValue(of({ data: {} }));

      await controller.deleteAccount(makeRequest());

      expect(httpService.delete).toHaveBeenCalledWith(`${AUTH_URL}/auth/me`, {
        headers: { 'x-user-id': 'user-1' },
      });
    });
  });
});
