import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { InvestigationsProxyController } from './investigations-proxy.controller';

const INVESTIGATIONS_URL = 'http://investigations-service:3003';
const USER = { id: 'user-1', email: 'a@a.com', role: 'USER' };
const EXPECTED_HEADERS = {
  'x-user-id': USER.id,
  'x-user-email': USER.email,
  'x-user-role': USER.role,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRequest = () => ({ user: USER }) as any;

describe('InvestigationsProxyController', () => {
  let controller: InvestigationsProxyController;
  let httpService: jest.Mocked<Pick<HttpService, 'get' | 'post' | 'delete'>>;

  beforeEach(async () => {
    httpService = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestigationsProxyController],
      providers: [
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { getOrThrow: () => INVESTIGATIONS_URL } },
      ],
    }).compile();

    controller = module.get<InvestigationsProxyController>(InvestigationsProxyController);
  });

  it('create transmet le body et les headers utilisateur', async () => {
    (httpService.post as jest.Mock).mockReturnValue(of({ data: { id: 'inv-1' } }));

    const result = await controller.create({ email: 'test@gmail.com' }, makeRequest());

    expect(httpService.post).toHaveBeenCalledWith(
      `${INVESTIGATIONS_URL}/investigations`,
      { email: 'test@gmail.com' },
      { headers: EXPECTED_HEADERS },
    );
    expect(result).toEqual({ id: 'inv-1' });
  });

  it('findAll transmet les query params et les headers utilisateur', async () => {
    (httpService.get as jest.Mock).mockReturnValue(of({ data: [] }));

    await controller.findAll(makeRequest(), { status: 'COMPLETED' });

    expect(httpService.get).toHaveBeenCalledWith(`${INVESTIGATIONS_URL}/investigations`, {
      headers: EXPECTED_HEADERS,
      params: { status: 'COMPLETED' },
    });
  });

  it('findOne transmet l\'id dans l\'URL', async () => {
    (httpService.get as jest.Mock).mockReturnValue(of({ data: { id: 'inv-1' } }));

    await controller.findOne('inv-1', makeRequest());

    expect(httpService.get).toHaveBeenCalledWith(`${INVESTIGATIONS_URL}/investigations/inv-1`, {
      headers: EXPECTED_HEADERS,
      params: undefined,
    });
  });

  it('retry poste vers /:id/retry', async () => {
    (httpService.post as jest.Mock).mockReturnValue(of({ data: { id: 'inv-1', status: 'PENDING' } }));

    await controller.retry('inv-1', makeRequest());

    expect(httpService.post).toHaveBeenCalledWith(
      `${INVESTIGATIONS_URL}/investigations/inv-1/retry`,
      null,
      { headers: EXPECTED_HEADERS },
    );
  });

  it('remove supprime une investigation par id', async () => {
    (httpService.delete as jest.Mock).mockReturnValue(of({ data: undefined }));

    await controller.remove('inv-1', makeRequest());

    expect(httpService.delete).toHaveBeenCalledWith(`${INVESTIGATIONS_URL}/investigations/inv-1`, {
      headers: EXPECTED_HEADERS,
    });
  });

  it('removeAll supprime toutes les investigations de l\'utilisateur', async () => {
    (httpService.delete as jest.Mock).mockReturnValue(of({ data: undefined }));

    await controller.removeAll(makeRequest());

    expect(httpService.delete).toHaveBeenCalledWith(`${INVESTIGATIONS_URL}/investigations`, {
      headers: EXPECTED_HEADERS,
    });
  });

  it('propage le statut HTTP renvoyé par investigations-service', async () => {
    (httpService.get as jest.Mock).mockReturnValue(
      throwError(() => ({ isAxiosError: true, response: { status: 404, data: { message: 'Not found' } } })),
    );

    await expect(controller.findOne('missing', makeRequest())).rejects.toThrow(HttpException);
  });

  it('lève ServiceUnavailableException si investigations-service est injoignable', async () => {
    (httpService.get as jest.Mock).mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

    await expect(controller.findOne('inv-1', makeRequest())).rejects.toThrow(ServiceUnavailableException);
  });
});
