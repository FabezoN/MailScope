import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { getOrThrow: jest.fn().mockReturnValue('secret') } as unknown as ConfigService;

  it('mappe le payload JWT vers l\'utilisateur authentifié', () => {
    const strategy = new JwtStrategy(config);

    const result = strategy.validate({ sub: 'user-1', email: 'a@a.com', role: 'ADMIN' });

    expect(result).toEqual({ id: 'user-1', email: 'a@a.com', role: 'ADMIN' });
  });
});
