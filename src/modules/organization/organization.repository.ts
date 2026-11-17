
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  Repository,
} from 'typeorm';

import { Organization } from '../../schemas/Organization.schema';

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
  ) {}

  async create(
    name: string,
    manager?: EntityManager,
  ): Promise<Organization> {
    const repository = manager
      ? manager.getRepository(Organization)
      : this.repository;

    const organization = repository.create({ name });

    return repository.save(organization);
  }

  async findById(
    organizationId: string,
  ): Promise<Organization | null> {
    return this.repository.findOne({
      where: { id: organizationId },
    });
  }
}
