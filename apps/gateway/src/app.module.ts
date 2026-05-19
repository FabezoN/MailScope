import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthProxyModule } from './modules/auth/auth-proxy.module';
import { InvestigationsProxyModule } from './modules/investigations/investigations-proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthProxyModule,
    InvestigationsProxyModule,
  ],
})
export class AppModule {}
