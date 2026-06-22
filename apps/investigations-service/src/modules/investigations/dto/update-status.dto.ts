import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { InvestigationStatus } from '../entities/investigation.entity';

export class UpdateStatusDto {
  @IsEnum(InvestigationStatus)
  status!: InvestigationStatus;

  @IsOptional()
  @IsObject()
  result?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}
