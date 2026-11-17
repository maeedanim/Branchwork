import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '../../schemas/Role.schema';

@Injectable()
export class RbacRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async create(
    organizationId: string,
    name: string,
    permissions: string[],
  ): Promise<Role> {
    const role = this.repository.create({
      organizationId,
      name,
      permissions,
    });

    return this.repository.save(role);
  }

  async findAll(organizationId: string): Promise<Role[]> {
    return this.repository.find({
      where: { organizationId },
      order: {
        createdAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  async findById(
    organizationId: string,
    roleId: string,
  ): Promise<Role | null> {
    return this.repository.findOne({
      where: {
        id: roleId,
        organizationId,
      },
    });
  }

  async update(
    role: Role,
    updates: Partial<Pick<Role, 'name' | 'permissions'>>,
  ): Promise<Role> {
    Object.assign(role, updates);

    return this.repository.save(role);
  }

  async delete(
    organizationId: string,
    roleId: string,
  ): Promise<void> {
    await this.repository.delete({
      id: roleId,
      organizationId,
    });
  }
}