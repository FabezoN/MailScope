import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OsintModule } from './modules/osint/osint.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OsintModule,
    HealthModule,
  ],
})
export class AppModule {}
