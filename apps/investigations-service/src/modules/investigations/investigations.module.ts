import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';
import { Investigation } from './entities/investigation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Investigation]), HttpModule],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
})
export class InvestigationsModule {}
