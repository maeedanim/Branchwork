
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  Repository,
} from 'typeorm';

import { User } from '../../schemas/User.schema';
import type { PaginationParams } from '../../common/interfaces/pagination.interface';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async createOwner(
    organizationId: string,
    name: string,
    email: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager
      ? manager.getRepository(User)
      : this.repository;

    const user = repository.create({
      organizationId,
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
      userType: 'OWNER',
      branchId: null,
      roleId: null,
    });

    return repository.save(user);
  }

  async createStaff(
    organizationId: string,
    name: string,
    email: string,
    passwordHash: string,
    branchId: string,
    roleId: string,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager
      ? manager.getRepository(User)
      : this.repository;

    const user = repository.create({
      organizationId,
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
      userType: 'STAFF',
      branchId,
      roleId,
    });

    return repository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();
  }

  async findAuthUserById(userId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id: userId },
    });
  }

  async findById(
    organizationId: string,
    userId: string,
  ): Promise<User | null> {
    return this.repository.findOne({
      where: {
        id: userId,
        organizationId,
      },
    });
  }

  async findAllStaff(
    organizationId: string,
    pagination: PaginationParams,
    branchId?: string,
  ): Promise<[User[], number]> {
    const query = this.repository
      .createQueryBuilder('user')
      .where('user.organizationId = :organizationId', {
        organizationId,
      })
      .andWhere('user.userType = :userType', {
        userType: 'STAFF',
      });

    if (branchId !== undefined) {
      query.andWhere('user.branchId = :branchId', {
        branchId,
      });
    }

    return query
      .orderBy('user.createdAt', 'ASC')
      .addOrderBy('user.id', 'ASC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();
  }

  async findStaffById(
    organizationId: string,
    userId: string,
    branchId?: string,
  ): Promise<User | null> {
    const query = this.repository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .andWhere('user.organizationId = :organizationId', {
        organizationId,
      })
      .andWhere('user.userType = :userType', {
        userType: 'STAFF',
      });

    if (branchId !== undefined) {
      query.andWhere('user.branchId = :branchId', {
        branchId,
      });
    }

    return query.getOne();
  }

  async updateStaff(
    user: User,
    updates: Partial<Pick<User, 'name' | 'branchId' | 'roleId'>>,
  ): Promise<User> {
    Object.assign(user, updates);

    return this.repository.save(user);
  }

  async deleteStaff(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    await this.repository.delete({
      id: userId,
      organizationId,
      userType: 'STAFF',
    });
  }
}
