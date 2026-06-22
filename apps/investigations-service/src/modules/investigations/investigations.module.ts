import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';
import { Investigation } from './entities/investigation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Investigation]),
    BullModule.registerQueue({ name: 'email-analysis' }),
  ],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
})
export class InvestigationsModule {}
