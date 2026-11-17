
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

import { NoLeadingSpecialChars } from '../../../common/decorators/noLeadingSpecialChars';

export class CreateProductDto {
  @ApiProperty({
    example: 'Wireless Mouse',
    maxLength: 100,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  @NoLeadingSpecialChars()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  branchId!: string;

  @ApiPropertyOptional({
    example: 'Electronics',
    maxLength: 50,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 50)
  category?: string | null;

  @ApiPropertyOptional({
    example: 100,
    default: 0,
    minimum: 0,
    maximum: 2147483647,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock = 0;
}
