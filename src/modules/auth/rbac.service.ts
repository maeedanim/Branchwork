import { Injectable, NotFoundException } from '@nestjs/common';

import { RbacRepository } from './rbac.repository';
import { Role } from '../../schemas/Role.schema';
import { PERMISSION_CATALOG } from '../../common/constants/permissions.constants';

@Injectable()
export class RbacService {
  constructor(
    private readonly rbacRepository: RbacRepository,
  ) {}

  async findRoleById(
    organizationId: string,
    roleId: string,
  ): Promise<Role> {
    const role = await this.rbacRepository.findById(
      organizationId,
      roleId,
    );

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return role;
  }

  async getRolePermissions(
    organizationId: string,
    roleId: string,
  ): Promise<string[]> {
    const role = await this.findRoleById(organizationId, roleId);

    return role.permissions;
  }

  getPermissionCatalog(): string[] {
    return [...PERMISSION_CATALOG];
  }
}