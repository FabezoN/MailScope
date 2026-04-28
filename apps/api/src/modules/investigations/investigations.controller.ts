import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { InvestigationsService } from './investigations.service';

@Controller('investigations')
export class InvestigationsController {
  constructor(private readonly investigationsService: InvestigationsService) {}

  @Get()
  findAll() {
    return this.investigationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.investigationsService.findOne(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.investigationsService.create(body);
  }
}
