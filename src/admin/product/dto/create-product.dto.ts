import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsInt()
  @Min(1)
  courseId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  thumbnail?: string | null;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}
