import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './modules/health/health.module';
import { InvestigationsModule } from './modules/investigations/investigations.module';
import { Investigation } from './modules/investigations/entities/investigation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('DATABASE_HOST'),
        port: config.getOrThrow<number>('DATABASE_PORT'),
        username: config.getOrThrow('DATABASE_USER'),
        password: config.getOrThrow('DATABASE_PASSWORD'),
        database: config.getOrThrow('INVESTIGATIONS_DATABASE_NAME'),
        entities: [Investigation],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    HealthModule,
    InvestigationsModule,
  ],
})
export class AppModule {}
