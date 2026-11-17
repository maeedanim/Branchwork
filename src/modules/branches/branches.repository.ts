import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  Repository,
} from 'typeorm';

import { Branch } from '../../schemas/Branch.schema';

@Injectable()
export class BranchesRepository {
  constructor(
    @InjectRepository(Branch)
    private readonly repository: Repository<Branch>,
  ) {}

  async create(
    organizationId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<Branch> {
    const repository = manager
      ? manager.getRepository(Branch)
      : this.repository;

    const branch = repository.create({
      organizationId,
      name,
    });

    return repository.save(branch);
  }

  async findAll(organizationId: string): Promise<Branch[]> {
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
    branchId: string,
  ): Promise<Branch | null> {
    return this.repository.findOne({
      where: {
        id: branchId,
        organizationId,
      },
    });
  }

  async update(
    branch: Branch,
    name: string,
  ): Promise<Branch> {
    branch.name = name;
    return this.repository.save(branch);
  }

  async delete(
    organizationId: string,
    branchId: string,
  ): Promise<void> {
    await this.repository.delete({
      id: branchId,
      organizationId,
    });
  }
}