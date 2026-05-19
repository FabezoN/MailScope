import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les rapports' })
  @ApiOkResponse({ description: 'Liste des rapports' })
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rapport par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du rapport' })
  @ApiOkResponse({ description: 'Rapport trouvé' })
  @ApiNotFoundResponse({ description: 'Rapport introuvable' })
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau rapport' })
  @ApiCreatedResponse({ description: 'Rapport créé avec succès' })
  create(@Body() dto: CreateReportDto) {
    return this.reportsService.create(dto);
  }
}
