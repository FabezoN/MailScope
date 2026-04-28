import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(_credentials: unknown): Record<string, string> {
    return { message: 'TODO: implement login' };
  }

  register(_dto: unknown): Record<string, string> {
    return { message: 'TODO: implement register' };
  }
}
