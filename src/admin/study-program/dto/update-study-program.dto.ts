import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStudyProgramDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  image?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
