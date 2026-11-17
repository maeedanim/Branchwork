import { NotFoundException } from '@nestjs/common';

import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: jest.Mocked<
    Pick<OrganizationRepository, 'create' | 'findById'>
  >;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
    };

    service = new OrganizationService(
      repository as unknown as OrganizationRepository,
    );
  });

  describe('create', () => {
    it('should delegate organization creation to the repository', async () => {
      const organization = {
        id: 'organization-123',
        name: 'Branchwork',
      };

      repository.create.mockResolvedValue(organization as any);

      const manager = {} as any;

      const result = await service.create(
        'Branchwork',
        manager,
      );

      expect(repository.create).toHaveBeenCalledWith(
        'Branchwork',
        manager,
      );
      expect(result).toEqual(organization);
    });

    it('should allow creation without an EntityManager', async () => {
      const organization = {
        id: 'organization-123',
        name: 'Branchwork',
      };

      repository.create.mockResolvedValue(organization as any);

      await service.create('Branchwork');

      expect(repository.create).toHaveBeenCalledWith(
        'Branchwork',
        undefined,
      );
    });
  });

  describe('findById', () => {
    it('should return the organization when it exists', async () => {
      const organization = {
        id: 'organization-123',
        name: 'Branchwork',
      };

      repository.findById.mockResolvedValue(organization as any);

      const result = await service.findById('organization-123');

      expect(repository.findById).toHaveBeenCalledWith(
        'organization-123',
      );
      expect(result).toEqual(organization);
    });

    it('should throw NotFoundException when the organization does not exist', async () => {
      repository.findById.mockResolvedValue(null as any);

      await expect(
        service.findById('organization-123'),
      ).rejects.toThrow(
        new NotFoundException('Organization not found.'),
      );
    });
  });
});