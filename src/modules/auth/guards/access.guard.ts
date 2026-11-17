
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { RequestUser } from '../../../common/interfaces/request-user.interface';
import type { Permission } from '../../../common/constants/permissions.constants';

import { RbacService } from '../rbac.service';
import { ACCESS_METADATA_KEY } from '../decorators/auth.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const accessType = this.reflector.getAllAndOverride<string>(
      ACCESS_METADATA_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (accessType === 'PUBLIC') {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication is required.',
      );
    }

    if (accessType === 'OWNER_ONLY') {
      if (user.userType !== 'OWNER') {
        throw new ForbiddenException(
          'Only organization owners can perform this action.',
        );
      }

      return true;
    }

    if (accessType !== 'PERMISSIONS') {
      return true;
    }

    // Owners bypass permission checks.
    if (user.userType === 'OWNER') {
      return true;
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(
        REQUIRED_PERMISSIONS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      ) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    if (!user.roleId) {
      throw new ForbiddenException(
        'Your account does not have an assigned role.',
      );
    }

    const grantedPermissions =
      await this.rbacService.getRolePermissions(
        user.organizationId,
        user.roleId,
      );

    const hasAllPermissions = requiredPermissions.every(
      (permission) =>
        grantedPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    return true;
  }
}
