
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { PERMISSIONS } from '../../common/constants/permissions.constants';
import { Role } from '../../schemas/Role.schema';
import { RbacRepository } from './rbac.repository';
import { RbacAdminService } from './rbac-admin.service';

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

describe('RbacAdminService', () => {
  let service: RbacAdminService;
  let repository: jest.Mocked<
    Pick<
      RbacRepository,
      'create' | 'findAll' | 'findById' | 'update' | 'delete'
    >
  >;

  const organizationId = 'organization-123';
  const roleId = 'role-123';

  const role = {
    id: roleId,
    organizationId,
    name: 'Branch Manager',
    permissions: [PERMISSIONS.PRODUCT_VIEW],
  } as Role;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = new RbacAdminService(
      repository as unknown as RbacRepository,
    );
  });

  describe('createRole', () => {
    it('should create a role with valid permissions', async () => {
      repository.create.mockResolvedValue(role);

      const dto = {
        name: 'Branch Manager',
        permissions: [PERMISSIONS.PRODUCT_VIEW],
      };

      const result = await service.createRole(
        organizationId,
        dto,
      );

      expect(repository.create).toHaveBeenCalledWith(
        organizationId,
        dto.name,
        dto.permissions,
      );
      expect(result).toEqual(role);
    });

    it('should allow creating a role with no permissions', async () => {
      const roleWithoutPermissions = {
        ...role,
        permissions: [],
      } as Role;

      repository.create.mockResolvedValue(
        roleWithoutPermissions,
      );

      const result = await service.createRole(
        organizationId,
        {
          name: 'New Role',
          permissions: [],
        },
      );

      expect(result.permissions).toEqual([]);
    });

    it('should reject product.organize without product.view', async () => {
      await expect(
        service.createRole(organizationId, {
          name: 'Invalid Role',
          permissions: [PERMISSIONS.PRODUCT_ORGANIZE],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'product.organize requires product.view.',
        ),
      );

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should allow product.organize when product.view is also assigned', async () => {
      const permissions = [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_ORGANIZE,
      ];

      repository.create.mockResolvedValue({
        ...role,
        permissions,
      } as Role);

      await service.createRole(organizationId, {
        name: 'Branch Manager',
        permissions,
      });

      expect(repository.create).toHaveBeenCalledWith(
        organizationId,
        'Branch Manager',
        permissions,
      );
    });

    it('should throw ConflictException when the role name already exists', async () => {
      repository.create.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.createRole(organizationId, {
          name: 'Branch Manager',
          permissions: [],
        }),
      ).rejects.toThrow(
        new ConflictException(
          'A role with this name already exists.',
        ),
      );
    });

    it('should propagate errors that are not database query errors', async () => {
      const error = new Error('Unexpected error.');
      repository.create.mockRejectedValue(error);

      await expect(
        service.createRole(organizationId, {
          name: 'Branch Manager',
          permissions: [],
        }),
      ).rejects.toThrow(error);
    });
  });

  describe('findAllRoles', () => {
    it('should return all roles belonging to the organization', async () => {
      repository.findAll.mockResolvedValue([role]);

      const result = await service.findAllRoles(
        organizationId,
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        organizationId,
      );
      expect(result).toEqual([role]);
    });
  });

  describe('findRole', () => {
    it('should return the requested role', async () => {
      repository.findById.mockResolvedValue(role);

      const result = await service.findRole(
        organizationId,
        roleId,
      );

      expect(repository.findById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );
      expect(result).toEqual(role);
    });

    it('should throw NotFoundException when the role does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.findRole(organizationId, roleId),
      ).rejects.toThrow(
        new NotFoundException('Role not found.'),
      );
    });
  });

  describe('updateRole', () => {
    it('should update a role name', async () => {
      const dto = { name: 'Updated Manager' };
      const updatedRole = {
        ...role,
        name: dto.name,
      } as Role;

      repository.findById.mockResolvedValue(role);
      repository.update.mockResolvedValue(updatedRole);

      const result = await service.updateRole(
        organizationId,
        roleId,
        dto,
      );

      expect(repository.findById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );
      expect(repository.update).toHaveBeenCalledWith(
        role,
        dto,
      );
      expect(result).toEqual(updatedRole);
    });

    it('should update role permissions', async () => {
      const dto = {
        permissions: [
          PERMISSIONS.PRODUCT_VIEW,
          PERMISSIONS.PRODUCT_ORGANIZE,
        ],
      };

      const updatedRole = {
        ...role,
        permissions: dto.permissions,
      } as Role;

      repository.findById.mockResolvedValue(role);
      repository.update.mockResolvedValue(updatedRole);

      const result = await service.updateRole(
        organizationId,
        roleId,
        dto,
      );

      expect(repository.update).toHaveBeenCalledWith(
        role,
        dto,
      );
      expect(result.permissions).toEqual(dto.permissions);
    });

    it('should reject an update without any fields', async () => {
      await expect(
        service.updateRole(organizationId, roleId, {}),
      ).rejects.toThrow(
        new BadRequestException(
          'At least one field must be provided.',
        ),
      );

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should reject product.organize without product.view during update', async () => {
      await expect(
        service.updateRole(organizationId, roleId, {
          permissions: [PERMISSIONS.PRODUCT_ORGANIZE],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'product.organize requires product.view.',
        ),
      );

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a nonexistent role', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.updateRole(organizationId, roleId, {
          name: 'Updated Manager',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the updated role name already exists', async () => {
      repository.findById.mockResolvedValue(role);
      repository.update.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.updateRole(organizationId, roleId, {
          name: 'Existing Role',
        }),
      ).rejects.toThrow(
        new ConflictException(
          'A role with this name already exists.',
        ),
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete an existing role', async () => {
      repository.findById.mockResolvedValue(role);
      repository.delete.mockResolvedValue(undefined);

      await expect(
        service.deleteRole(organizationId, roleId),
      ).resolves.toBeUndefined();

      expect(repository.findById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );
      expect(repository.delete).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );
    });

    it('should throw NotFoundException when deleting a nonexistent role', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.deleteRole(organizationId, roleId),
      ).rejects.toThrow(NotFoundException);

      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the role is assigned to staff', async () => {
      repository.findById.mockResolvedValue(role);
      repository.delete.mockRejectedValue(
        createQueryFailedError('23503'),
      );

      await expect(
        service.deleteRole(organizationId, roleId),
      ).rejects.toThrow(
        new ConflictException(
          'This role is assigned to staff members and cannot be deleted.',
        ),
      );
    });
  });

  describe('getPermissionCatalog', () => {
    it('should return all available permissions', () => {
      expect(service.getPermissionCatalog()).toEqual(
        Object.values(PERMISSIONS),
      );
    });
  });
});
