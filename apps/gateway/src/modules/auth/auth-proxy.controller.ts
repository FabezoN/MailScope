import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() body: unknown) {
    return this.forward('register', body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    return this.forward('login', body);
  }

  private async forward(path: string, body: unknown) {
    const base = this.configService.getOrThrow('AUTH_SERVICE_URL');
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${base}/auth/${path}`, body),
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        throw new HttpException(err.response.data, err.response.status);
      }
      throw new ServiceUnavailableException('auth-service unavailable');
    }
  }
}
