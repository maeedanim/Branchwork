
import {
  applyDecorators,
  SetMetadata,
} from '@nestjs/common';

import type { Permission } from '../../../common/constants/permissions.constants';
import { ACCESS_METADATA_KEY } from './auth.decorator';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (
  ...permissions: Permission[]
) =>
  applyDecorators(
    SetMetadata(ACCESS_METADATA_KEY, 'PERMISSIONS'),
    SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions),
  );
