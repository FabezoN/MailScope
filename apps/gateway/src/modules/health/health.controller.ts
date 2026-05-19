import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiOkResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Vérifier la santé de la base de données' })
  @ApiOkResponse({ description: 'Base de données opérationnelle' })
  @ApiServiceUnavailableResponse({ description: 'Base de données inaccessible' })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
