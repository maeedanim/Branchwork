
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { RbacRepository } from './rbac.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PERMISSIONS } from '../../common/constants/permissions.constants';
import { Role } from '../../schemas/Role.schema';

interface PostgresError {
  code?: string;
}

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

    try {
      return await this.rbacRepository.create(
        organizationId,
        dto.name,
        dto.permissions,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
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
    if (
      dto.name === undefined &&
      dto.permissions === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided.',
      );
    }

    if (dto.permissions !== undefined) {
      this.validatePermissions(dto.permissions);
    }

    const role = await this.findRole(
      organizationId,
      roleId,
    );

    try {
      return await this.rbacRepository.update(role, dto);
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async deleteRole(
    organizationId: string,
    roleId: string,
  ): Promise<void> {
    await this.findRole(organizationId, roleId);

    try {
      await this.rbacRepository.delete(
        organizationId,
        roleId,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
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

  private handleDatabaseError(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const databaseError =
      error.driverError as PostgresError;

    if (databaseError.code === '23505') {
      throw new ConflictException(
        'A role with this name already exists.',
      );
    }

    if (databaseError.code === '23503') {
      throw new ConflictException(
        'This role is assigned to staff members and cannot be deleted.',
      );
    }
  }
}
