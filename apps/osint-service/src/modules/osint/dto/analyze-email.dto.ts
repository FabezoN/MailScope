import { IsEmail } from 'class-validator';

export class AnalyzeEmailDto {
  @IsEmail()
  email!: string;
}
