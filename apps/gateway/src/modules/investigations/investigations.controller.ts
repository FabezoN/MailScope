import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface AuthenticatedRequest extends Express.Request {
  user: { id: string; email: string; role: string };
}

@Controller('investigations')
@UseGuards(JwtAuthGuard)
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  analyze(@Body() dto: CreateInvestigationDto, @Request() req: AuthenticatedRequest) {
    return this.investigationsService.analyze(dto.email);
  }
}
