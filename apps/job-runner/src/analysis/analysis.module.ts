import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { AnalysisProcessor } from './analysis.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'email-analysis' }),
    HttpModule,
  ],
  providers: [AnalysisProcessor],
})
export class AnalysisModule {}
