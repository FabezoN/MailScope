import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(
    @Body() dto: CreateInvestigationDto,
    @Headers('x-user-id') userId: string,
  ) {
    return this.investigationsService.create(dto.email, userId);
  }

  @Get()
  findAll(@Headers('x-user-id') userId: string) {
    return this.investigationsService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.investigationsService.findOne(id, userId);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.investigationsService.updateStatus(id, dto.status, dto.result, dto.errorMessage);
  }
}
