
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { Branch } from '../../schemas/Branch.schema';
import { BranchesRepository } from './branches.repository';
import { BranchesService } from './branches.service';

function createQueryFailedError(code: string): QueryFailedError {
  const driverError = Object.assign(
    new Error('Database query failed.'),
    { code },
  );

  return new QueryFailedError(
    'TEST QUERY',
    [],
    driverError,
  );
}

describe('BranchesService', () => {
  let service: BranchesService;
  let repository: jest.Mocked<
    Pick<
      BranchesRepository,
      'create' | 'findAll' | 'findById' | 'update' | 'delete'
    >
  >;

  const organizationId = 'organization-123';
  const branchId = 'branch-123';

  const branch = {
    id: branchId,
    organizationId,
    name: 'Dhaka Branch',
  } as Branch;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = new BranchesService(
      repository as unknown as BranchesRepository,
    );
  });

  describe('create', () => {
    it('should create a branch for the organization', async () => {
      repository.create.mockResolvedValue(branch);

      const result = await service.create(organizationId, {
        name: 'Dhaka Branch',
      });

      expect(repository.create).toHaveBeenCalledWith(
        organizationId,
        'Dhaka Branch',
      );
      expect(result).toEqual(branch);
    });

    it('should throw ConflictException when a branch with the same name already exists', async () => {
      repository.create.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.create(organizationId, {
          name: 'Dhaka Branch',
        }),
      ).rejects.toThrow(
        new ConflictException(
          'A branch with this name already exists.',
        ),
      );
    });

    it('should propagate errors that are not database query errors', async () => {
      const error = new Error('Unexpected error.');
      repository.create.mockRejectedValue(error);

      await expect(
        service.create(organizationId, {
          name: 'Dhaka Branch',
        }),
      ).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all branches belonging to the organization', async () => {
      repository.findAll.mockResolvedValue([branch]);

      const result = await service.findAll(organizationId);

      expect(repository.findAll).toHaveBeenCalledWith(
        organizationId,
      );
      expect(result).toEqual([branch]);
    });
  });

  describe('findById', () => {
    it('should return a branch belonging to the organization', async () => {
      repository.findById.mockResolvedValue(branch);

      const result = await service.findById(
        organizationId,
        branchId,
      );

      expect(repository.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );
      expect(result).toEqual(branch);
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findById(organizationId, branchId),
      ).rejects.toThrow(
        new NotFoundException('Branch not found.'),
      );
    });
  });

  describe('update', () => {
    it('should update the branch name', async () => {
      const updatedBranch = {
        ...branch,
        name: 'Updated Branch',
      } as Branch;

      repository.findById.mockResolvedValue(branch);
      repository.update.mockResolvedValue(updatedBranch);

      const result = await service.update(
        organizationId,
        branchId,
        { name: 'Updated Branch' },
      );

      expect(repository.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );
      expect(repository.update).toHaveBeenCalledWith(
        branch,
        'Updated Branch',
      );
      expect(result).toEqual(updatedBranch);
    });

    it('should reject an update without a name', async () => {
      await expect(
        service.update(organizationId, branchId, {}),
      ).rejects.toThrow(
        new BadRequestException(
          'At least one field must be provided.',
        ),
      );

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a nonexistent branch', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(organizationId, branchId, {
          name: 'Updated Branch',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the updated name already exists', async () => {
      repository.findById.mockResolvedValue(branch);
      repository.update.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.update(organizationId, branchId, {
          name: 'Existing Branch',
        }),
      ).rejects.toThrow(
        new ConflictException(
          'A branch with this name already exists.',
        ),
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing branch', async () => {
      repository.findById.mockResolvedValue(branch);
      repository.delete.mockResolvedValue(undefined);

      await expect(
        service.delete(organizationId, branchId),
      ).resolves.toBeUndefined();

      expect(repository.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );
      expect(repository.delete).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );
    });

    it('should throw NotFoundException when deleting a nonexistent branch', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete(organizationId, branchId),
      ).rejects.toThrow(NotFoundException);

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the branch is still in use', async () => {
      repository.findById.mockResolvedValue(branch);
      repository.delete.mockRejectedValue(
        createQueryFailedError('23503'),
      );

      await expect(
        service.delete(organizationId, branchId),
      ).rejects.toThrow(
        new ConflictException(
          'This branch is currently in use and cannot be deleted.',
        ),
      );
    });
  });
});
