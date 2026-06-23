import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryInvestigationDto } from './dto/query-investigation.dto';

@ApiTags('investigations')
@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Lancer une nouvelle investigation" })
  create(
    @Body() dto: CreateInvestigationDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.investigationsService.create(dto.email, userId);
  }

  @Get()
  @ApiOperation({ summary: "Lister les investigations de l'utilisateur (filtre statut optionnel)" })
  findAll(
    @Headers('x-user-id') userId: string,
    @Query() query: QueryInvestigationDto,
  ) {
    return this.investigationsService.findAllByUser(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer une investigation avec son rapport" })
  findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.investigationsService.findOne(id, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer toutes les investigations de l'utilisateur" })
  removeAll(@Headers('x-user-id') userId: string) {
    return this.investigationsService.removeAll(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer une investigation" })
  remove(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.investigationsService.remove(id, userId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: "Relancer une investigation échouée ou complétée" })
  retry(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.investigationsService.retry(id, userId);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.investigationsService.updateStatus(id, dto.status, dto.result, dto.errorMessage);
  }
}
