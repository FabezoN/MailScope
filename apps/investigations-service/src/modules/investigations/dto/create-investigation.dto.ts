import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateInvestigationDto {
  @ApiProperty({ example: 'target@example.com', description: "Adresse email à analyser" })
  @IsEmail()
  email!: string;
}
