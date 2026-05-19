import {
  Body, Controller, Get, HttpCode, HttpException,
  HttpStatus, Param, Post, Request, ServiceUnavailableException, UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface AuthRequest extends Express.Request {
  user: { id: string; email: string; role: string };
}

@Controller('investigations')
@UseGuards(JwtAuthGuard)
export class InvestigationsProxyController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() body: unknown, @Request() req: AuthRequest) {
    return this.forward('POST', '', body, req.user);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.forward('GET', '', null, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.forward('GET', `/${id}`, null, req.user);
  }

  private async forward(
    method: 'GET' | 'POST',
    subPath: string,
    body: unknown,
    user: AuthRequest['user'],
  ) {
    const base = this.configService.getOrThrow('INVESTIGATIONS_SERVICE_URL');
    const url = `${base}/investigations${subPath}`;
    const headers = {
      'x-user-id': user.id,
      'x-user-email': user.email,
      'x-user-role': user.role,
    };

    try {
      const { data } = await firstValueFrom(
        method === 'POST'
          ? this.httpService.post(url, body, { headers })
          : this.httpService.get(url, { headers }),
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        throw new HttpException(err.response.data, err.response.status);
      }
      throw new ServiceUnavailableException('investigations-service unavailable');
    }
  }
}
