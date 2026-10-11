import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  semester?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  credits?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  studyProgramId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
