import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OsintModule } from './modules/osint/osint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OsintModule,
  ],
})
export class AppModule {}
