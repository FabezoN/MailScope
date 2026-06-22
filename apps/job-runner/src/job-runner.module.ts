import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { BullModule } from "@nestjs/bullmq";
import { Investigation } from "./entities/investigation.entity";
import { Report } from "./entities/report.entity";
import { InvestigationProcessor } from "./processors/investigation.processor";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.getOrThrow("DATABASE_HOST"),
        port: config.getOrThrow<number>("DATABASE_PORT"),
        username: config.getOrThrow("DATABASE_USER"),
        password: config.getOrThrow("DATABASE_PASSWORD"),
        database: config.getOrThrow("INVESTIGATIONS_DATABASE_NAME"),
        entities: [Investigation, Report],
        synchronize: false,
      }),
    }),
    HttpModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow("REDIS_HOST"),
          port: config.getOrThrow<number>("REDIS_PORT"),
        },
      }),
    }),
    BullModule.registerQueue({ name: "investigation-queue" }),
  ],
  providers: [InvestigationProcessor],
})
export class JobRunnerModule {}
