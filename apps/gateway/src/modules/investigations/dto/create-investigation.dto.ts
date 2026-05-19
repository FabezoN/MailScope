import { IsEmail } from 'class-validator';

export class CreateInvestigationDto {
  @IsEmail()
  email: string;
}
