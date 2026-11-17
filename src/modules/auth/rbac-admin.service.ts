import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RbacRepository } from './rbac.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PERMISSIONS } from '../../common/constants/permissions.constants';
import { Role } from '../../schemas/Role.schema';

@Injectable()
export class RbacAdminService {
  constructor(
    private readonly rbacRepository: RbacRepository,
  ) {}

  async createRole(
    organizationId: string,
    dto: CreateRoleDto,
  ): Promise<Role> {
    this.validatePermissions(dto.permissions);

    return this.rbacRepository.create(
      organizationId,
      dto.name,
      dto.permissions,
    );
  }

  async findAllRoles(organizationId: string): Promise<Role[]> {
    return this.rbacRepository.findAll(organizationId);
  }

  async findRole(
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

  async updateRole(
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    if (dto.name === undefined && dto.permissions === undefined) {
      throw new BadRequestException(
        'At least one field must be provided.',
      );
    }

    if (dto.permissions !== undefined) {
      this.validatePermissions(dto.permissions);
    }

    const role = await this.findRole(organizationId, roleId);

    return this.rbacRepository.update(role, dto);
  }

  async deleteRole(
    organizationId: string,
    roleId: string,
  ): Promise<void> {
    await this.findRole(organizationId, roleId);

    await this.rbacRepository.delete(organizationId, roleId);
  }

  getPermissionCatalog(): string[] {
    return Object.values(PERMISSIONS);
  }

  private validatePermissions(permissions: string[]): void {
    if (
      permissions.includes(PERMISSIONS.PRODUCT_ORGANIZE) &&
      !permissions.includes(PERMISSIONS.PRODUCT_VIEW)
    ) {
      throw new BadRequestException(
        'product.organize requires product.view.',
      );
    }
  }
}