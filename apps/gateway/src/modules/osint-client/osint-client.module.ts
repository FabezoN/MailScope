import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OsintClientService } from './osint-client.service';

@Module({
  imports: [HttpModule],
  providers: [OsintClientService],
  exports: [OsintClientService],
})
export class OsintClientModule {}
