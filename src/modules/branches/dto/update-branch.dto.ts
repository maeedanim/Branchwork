import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { NoLeadingSpecialChars } from '../../../common/decorators/noLeadingSpecialChars';

export class UpdateBranchDto {
  @ApiPropertyOptional({
    example: 'Gulshan Branch',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  @NoLeadingSpecialChars()
  name?: string;
}