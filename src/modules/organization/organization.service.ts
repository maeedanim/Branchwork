
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { Organization } from '../../schemas/Organization.schema';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async create(
    name: string,
    manager?: EntityManager,
  ): Promise<Organization> {
    return this.organizationRepository.create(name, manager);
  }

  async findById(
    organizationId: string,
  ): Promise<Organization> {
    const organization =
      await this.organizationRepository.findById(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return organization;
  }
}
