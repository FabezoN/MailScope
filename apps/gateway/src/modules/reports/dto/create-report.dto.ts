import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: "ID de l'investigation associée" })
  @IsUUID()
  @IsNotEmpty()
  investigationId!: string;

  @ApiPropertyOptional({ example: 'En-têtes suspects détectés', description: 'Contenu ou notes du rapport' })
  @IsOptional()
  @IsString()
  content?: string;
}
