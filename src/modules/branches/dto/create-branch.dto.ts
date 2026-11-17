import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  Length,
} from 'class-validator';

import { NoLeadingSpecialChars } from '../../../common/decorators/noLeadingSpecialChars';

export class CreateBranchDto {
  @ApiProperty({
    example: 'Dhanmondi Branch',
    minLength: 1,
    maxLength: 100,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  @NoLeadingSpecialChars()
  name!: string;
}