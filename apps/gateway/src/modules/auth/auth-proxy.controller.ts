import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Request,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface AuthRequest extends Express.Request {
  user: { id: string; email: string; role: string };
}

@Controller('auth')
export class AuthProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() body: unknown) {
    return this.forward('POST', 'register', body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    return this.forward('POST', 'login', body);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Body() body: unknown, @Request() req: AuthRequest) {
    return this.forwardWithUser('PATCH', 'me/password', body, req.user);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req: AuthRequest) {
    return this.forwardWithUser('DELETE', 'me', null, req.user);
  }

  private async forward(method: 'POST', path: string, body: unknown) {
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

  private async forwardWithUser(
    method: 'PATCH' | 'DELETE',
    path: string,
    body: unknown,
    user: AuthRequest['user'],
  ) {
    const base = this.configService.getOrThrow('AUTH_SERVICE_URL');
    const url = `${base}/auth/${path}`;
    const headers = { 'x-user-id': user.id };

    try {
      if (method === 'PATCH') {
        await firstValueFrom(this.httpService.patch(url, body, { headers }));
      } else {
        await firstValueFrom(this.httpService.delete(url, { headers }));
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        throw new HttpException(err.response.data, err.response.status);
      }
      throw new ServiceUnavailableException('auth-service unavailable');
    }
  }
}
