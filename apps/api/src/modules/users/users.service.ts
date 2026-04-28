import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findAll(): Record<string, string>[] {
    return [];
  }

  findOne(_id: string): Record<string, string> {
    return { message: 'TODO: implement findOne' };
  }
}
