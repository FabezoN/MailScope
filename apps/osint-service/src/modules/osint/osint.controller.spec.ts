import { Test, TestingModule } from '@nestjs/testing';
import { OsintController } from './osint.controller';
import { OsintService } from './osint.service';

describe('OsintController', () => {
  let controller: OsintController;
  let service: { analyze: jest.Mock };

  beforeEach(async () => {
    service = { analyze: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OsintController],
      providers: [{ provide: OsintService, useValue: service }],
    }).compile();

    controller = module.get<OsintController>(OsintController);
  });

  it('délègue l\'analyse au service avec le dto reçu', async () => {
    const dto = { email: 'test@gmail.com' };
    const expected = { email: dto.email, domain: 'gmail.com', holehe: [], xon: [] };
    service.analyze.mockResolvedValue(expected);

    const result = await controller.analyzeEmail(dto);

    expect(service.analyze).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
