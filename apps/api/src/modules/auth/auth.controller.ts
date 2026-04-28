import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: unknown) {
    return this.authService.login(body);
  }

  @Post('register')
  register(@Body() body: unknown) {
    return this.authService.register(body);
  }
}
