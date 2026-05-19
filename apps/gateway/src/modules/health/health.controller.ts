import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Vérifier la santé des microservices' })
  @ApiOkResponse({ description: 'Tous les services sont opérationnels' })
  @ApiServiceUnavailableResponse({ description: 'Un ou plusieurs services sont inaccessibles' })
  check() {
    const authUrl = this.configService.getOrThrow('AUTH_SERVICE_URL');
    const osintUrl = this.configService.getOrThrow('OSINT_SERVICE_URL');
    const investigationsUrl = this.configService.getOrThrow('INVESTIGATIONS_SERVICE_URL');

    return this.health.check([
      () => this.http.pingCheck('auth-service', `${authUrl}/health`),
      () => this.http.pingCheck('osint-service', `${osintUrl}/health`),
      () => this.http.pingCheck('investigations-service', `${investigationsUrl}/health`),
    ]);
  }
}
