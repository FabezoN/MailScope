import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';
import { Investigation } from './entities/investigation.entity';
import { Report } from './entities/report.entity';
import { INVESTIGATION_QUEUE } from './investigations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Investigation, Report]),
    BullModule.registerQueue({ name: INVESTIGATION_QUEUE }),
  ],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
})
export class InvestigationsModule {}
