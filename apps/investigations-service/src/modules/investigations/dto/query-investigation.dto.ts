import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvestigationStatus } from '../entities/investigation.entity';

export class QueryInvestigationDto {
  @ApiPropertyOptional({ enum: InvestigationStatus, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(InvestigationStatus)
  status?: InvestigationStatus;
}
