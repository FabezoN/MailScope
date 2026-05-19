import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  findAll(): Record<string, string>[] {
    return [];
  }

  findOne(_id: string): Record<string, string> {
    return { message: 'TODO: implement findOne' };
  }

  create(_dto: unknown): Record<string, string> {
    return { message: 'TODO: implement create' };
  }
}
