import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsInt()
  @Min(1)
  semester: number;

  @IsInt()
  @Min(1)
  credits: number;

  @IsInt()
  @Min(1)
  studyProgramId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;
}
