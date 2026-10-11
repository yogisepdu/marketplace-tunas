import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  courseId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug?: string;

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
