import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStudyProgramDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
