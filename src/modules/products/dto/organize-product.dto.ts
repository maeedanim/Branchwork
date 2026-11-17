
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsUUID,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class OrganizeProductDto {
  @ApiPropertyOptional({
    example: 'Accessories',
    maxLength: 50,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 50)
  category?: string;

  @ApiPropertyOptional({
    example: 75,
    minimum: 0,
    maximum: 2147483647,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  branchId?: string;
}
