
import { SetMetadata } from '@nestjs/common';

export const ACCESS_METADATA_KEY = 'access';

export type AccessType =
  | 'PUBLIC'
  | 'AUTHENTICATED'
  | 'OWNER_ONLY'
  | 'PERMISSIONS';

export const Public = () =>
  SetMetadata(ACCESS_METADATA_KEY, 'PUBLIC');

export const Authenticated = () =>
  SetMetadata(ACCESS_METADATA_KEY, 'AUTHENTICATED');

export const OwnerOnly = () =>
  SetMetadata(ACCESS_METADATA_KEY, 'OWNER_ONLY');
