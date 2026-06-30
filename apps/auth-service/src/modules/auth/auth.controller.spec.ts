import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = () => ({
  register: jest.fn(),
  login: jest.fn(),
  changePassword: jest.fn(),
  deleteAccount: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let service: ReturnType<typeof mockAuthService>;

  beforeEach(async () => {
    service = mockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register délègue le dto au service', async () => {
    service.register.mockResolvedValue({ access_token: 'tok' });
    const dto = { email: 'a@a.com', password: 'plain1234' };

    const result = await controller.register(dto);

    expect(service.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ access_token: 'tok' });
  });

  it('login délègue le dto au service', async () => {
    service.login.mockResolvedValue({ access_token: 'tok' });
    const dto = { email: 'a@a.com', password: 'plain1234' };

    const result = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ access_token: 'tok' });
  });

  it('changePassword transmet le x-user-id et le dto au service', async () => {
    const dto = { currentPassword: 'old-pw', newPassword: 'new-password' };

    await controller.changePassword('user-1', dto);

    expect(service.changePassword).toHaveBeenCalledWith('user-1', 'old-pw', 'new-password');
  });

  it('deleteAccount transmet le x-user-id au service', async () => {
    await controller.deleteAccount('user-1');

    expect(service.deleteAccount).toHaveBeenCalledWith('user-1');
  });
});
