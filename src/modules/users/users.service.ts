
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, QueryFailedError } from 'typeorm';

import { CryptoService } from '../../common/services/crypto.service';
import { User } from '../../schemas/User.schema';

import type { RequestUser } from '../../common/interfaces/request-user.interface';
import type {
  PaginationParams,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';

import { BranchesService } from '../branches/branches.service';
import { RbacService } from '../auth/rbac.service';

import { UsersRepository } from './users.repository';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

interface PostgresError {
  code?: string;
  constraint?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly branchesService: BranchesService,
    private readonly rbacService: RbacService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createOwner(
    organizationId: string,
    name: string,
    email: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<User> {
    this.validateRequiredId(organizationId, 'Organization ID');

    try {
      return await this.usersRepository.createOwner(
        organizationId,
        name,
        email,
        passwordHash,
        manager,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async createStaff(
    organizationId: string,
    dto: CreateStaffDto,
  ): Promise<User> {
    this.validateRequiredId(organizationId, 'Organization ID');
    this.validateRequiredId(dto.branchId, 'Branch ID');
    this.validateRequiredId(dto.roleId, 'Role ID');

    // Validate branch ownership.
    await this.branchesService.findById(
      organizationId,
      dto.branchId,
    );

    // Validate role ownership.
    await this.rbacService.findRoleById(
      organizationId,
      dto.roleId,
    );

    // Hash the password before persistence.
    const passwordHash = await this.cryptoService.hashPassword(
      dto.password,
    );

    try {
      return await this.usersRepository.createStaff(
        organizationId,
        dto.name,
        dto.email,
        passwordHash,
        dto.branchId,
        dto.roleId,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findAuthUserById(userId: string): Promise<User | null> {
    return this.usersRepository.findAuthUserById(userId);
  }

  async findById(
    organizationId: string,
    userId: string,
  ): Promise<User> {
    this.validateRequiredId(organizationId, 'Organization ID');
    this.validateRequiredId(userId, 'User ID');

    const user = await this.usersRepository.findById(
      organizationId,
      userId,
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async findAllStaff(
    requester: RequestUser,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<User>> {
    this.validateRequiredId(
      requester.organizationId,
      'Organization ID',
    );

    let branchId: string | undefined;

    if (requester.userType === 'STAFF') {
      if (!requester.branchId) {
        throw new ForbiddenException(
          'Your account is not assigned to a branch.',
        );
      }

      branchId = requester.branchId;
    }

    const [items, total] =
      await this.usersRepository.findAllStaff(
        requester.organizationId,
        pagination,
        branchId,
      );

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findStaffById(
    requester: RequestUser,
    userId: string,
  ): Promise<User> {
    this.validateRequiredId(
      requester.organizationId,
      'Organization ID',
    );
    this.validateRequiredId(userId, 'User ID');

    let branchId: string | undefined;

    if (requester.userType === 'STAFF') {
      if (!requester.branchId) {
        throw new ForbiddenException(
          'Your account is not assigned to a branch.',
        );
      }

      branchId = requester.branchId;
    }

    const user = await this.usersRepository.findStaffById(
      requester.organizationId,
      userId,
      branchId,
    );

    if (!user) {
      throw new NotFoundException('Staff member not found.');
    }

    return user;
  }

  async updateStaff(
    organizationId: string,
    userId: string,
    dto: UpdateStaffDto,
  ): Promise<User> {
    this.validateRequiredId(organizationId, 'Organization ID');
    this.validateRequiredId(userId, 'User ID');

    if (
      dto.name === undefined &&
      dto.branchId === undefined &&
      dto.roleId === undefined
    ) {
      throw new BadRequestException(
        'At least one field must be provided.',
      );
    }

    const user = await this.usersRepository.findStaffById(
      organizationId,
      userId,
    );

    if (!user) {
      throw new NotFoundException('Staff member not found.');
    }

    const branchId = dto.branchId ?? user.branchId;
    const roleId = dto.roleId ?? user.roleId;

    if (!branchId || !roleId) {
      throw new BadRequestException(
        'Staff members must have both a branch and a role.',
      );
    }

    // Validate both relationships before updating.
    await this.branchesService.findById(
      organizationId,
      branchId,
    );

    await this.rbacService.findRoleById(
      organizationId,
      roleId,
    );

    const updates: Partial<
      Pick<User, 'name' | 'branchId' | 'roleId'>
    > = {};

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    if (dto.branchId !== undefined) {
      updates.branchId = dto.branchId;
    }

    if (dto.roleId !== undefined) {
      updates.roleId = dto.roleId;
    }

    try {
      return await this.usersRepository.updateStaff(
        user,
        updates,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  async deleteStaff(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    this.validateRequiredId(organizationId, 'Organization ID');
    this.validateRequiredId(userId, 'User ID');

    const user = await this.usersRepository.findStaffById(
      organizationId,
      userId,
    );

    if (!user) {
      throw new NotFoundException('Staff member not found.');
    }

    try {
      await this.usersRepository.deleteStaff(
        organizationId,
        userId,
      );
    } catch (error: unknown) {
      this.handleDatabaseError(error);
      throw error;
    }
  }

  private validateRequiredId(
    value: string | null | undefined,
    fieldName: string,
  ): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(
        `${fieldName} is required.`,
      );
    }
  }

  private handleDatabaseError(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const databaseError =
      error.driverError as PostgresError | undefined;

    if (!databaseError?.code) {
      throw new ConflictException(
        'A database constraint was violated.',
      );
    }

    if (databaseError.code === '23505') {
      throw new ConflictException(
        'A user with this email already exists.',
      );
    }

    if (databaseError.code === '23503') {
      throw new ConflictException(
        'This record is currently in use and cannot be modified or deleted.',
      );
    }
  }
}
