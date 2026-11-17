
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';

import { NoLeadingSpecialChars } from '../../../common/decorators/noLeadingSpecialChars';

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'John Smith' })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  @NoLeadingSpecialChars()
  name?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  roleId?: string;
}
