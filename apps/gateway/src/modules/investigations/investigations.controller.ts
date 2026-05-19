import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface AuthenticatedRequest extends Express.Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('investigations')
@ApiBearerAuth()
@Controller('investigations')
@UseGuards(JwtAuthGuard)
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lancer une analyse OSINT sur une adresse email' })
  @ApiOkResponse({ description: 'Résultat de l\'analyse OSINT' })
  @ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
  analyze(@Body() dto: CreateInvestigationDto, @Request() req: AuthenticatedRequest) {
    return this.investigationsService.analyze(dto.email);
  }
}
