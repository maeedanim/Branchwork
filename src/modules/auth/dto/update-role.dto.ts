
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PERMISSION_CATALOG } from '../../../common/constants/permissions.constants';
import { NoLeadingSpecialChars } from '../../../common/decorators/noLeadingSpecialChars';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    example: 'Senior Branch Manager',
    description: 'Updated role name',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  @NoLeadingSpecialChars()
  name?: string;

  @ApiPropertyOptional({
    example: ['product.view', 'branch.view'],
    description: 'Updated permissions',
    isArray: true,
    enum: PERMISSION_CATALOG,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_CATALOG, { each: true })
  permissions?: string[];
}
