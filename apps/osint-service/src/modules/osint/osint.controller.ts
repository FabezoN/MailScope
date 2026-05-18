import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OsintService } from './osint.service';
import { AnalyzeEmailDto } from './dto/analyze-email.dto';

@Controller('osint')
export class OsintController {
  constructor(private readonly osintService: OsintService) {}

  @Post('email')
  @HttpCode(HttpStatus.OK)
  analyzeEmail(@Body() dto: AnalyzeEmailDto) {
    return this.osintService.analyze(dto);
  }
}
