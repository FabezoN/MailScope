import { Body, Controller, Delete, Headers, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  @ApiCreatedResponse({ description: 'Compte créé, token JWT retourné' })
  @ApiConflictResponse({ description: 'Email déjà utilisé' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authentifier un utilisateur' })
  @ApiOkResponse({ description: 'Authentification réussie, token JWT retourné' })
  @ApiUnauthorizedResponse({ description: 'Identifiants invalides' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Changer le mot de passe (x-user-id requis)' })
  @ApiNoContentResponse({ description: 'Mot de passe mis à jour' })
  @ApiUnauthorizedResponse({ description: 'Mot de passe actuel incorrect' })
  changePassword(
    @Headers('x-user-id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer son compte (x-user-id requis)' })
  @ApiNoContentResponse({ description: 'Compte supprimé' })
  deleteAccount(@Headers('x-user-id') userId: string) {
    return this.authService.deleteAccount(userId);
  }
}
