import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PERMISSION_CATALOG } from '../../../common/constants/permissions.constants';
import { NoLeadingSpecialChars } from '../../../common/decorators/noLeadingSpecialChars';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Branch Manager',
    description: 'Name of the role',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100)
  @NoLeadingSpecialChars()
  name!: string;

  @ApiProperty({
    example: ['product.view', 'product.organize', 'branch.view'],
    description: 'Permissions assigned to this role',
    isArray: true,
    enum: PERMISSION_CATALOG,
  })
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_CATALOG, { each: true })
  permissions!: string[];
}