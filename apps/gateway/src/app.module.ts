import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthProxyModule } from './modules/auth/auth-proxy.module';
import { InvestigationsProxyModule } from './modules/investigations/investigations-proxy.module';
import { HealthModule } from './modules/health/health.module';
import { SeedModule } from './modules/seed/seed.module';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthProxyModule,
    InvestigationsProxyModule,
    HealthModule,
    SeedModule,
  ],
})
export class AppModule {}
