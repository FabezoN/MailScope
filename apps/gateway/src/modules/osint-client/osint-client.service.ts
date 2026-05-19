import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OsintClientService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async analyzeEmail(email: string) {
    const baseUrl = this.configService.getOrThrow('OSINT_SERVICE_URL');
    const { data } = await firstValueFrom(
      this.httpService.post(`${baseUrl}/osint/email`, { email }),
    );
    return data;
  }
}
