import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthProxyModule } from './modules/auth/auth-proxy.module';
import { InvestigationsProxyModule } from './modules/investigations/investigations-proxy.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthProxyModule,
    InvestigationsProxyModule,
    HealthModule,
  ],
})
export class AppModule {}
