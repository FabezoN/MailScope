import { Module } from '@nestjs/common';
import { OsintClientModule } from '../osint-client/osint-client.module';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';

@Module({
  imports: [OsintClientModule],
  controllers: [InvestigationsController],
  providers: [InvestigationsService],
})
export class InvestigationsModule {}
