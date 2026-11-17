import { NotFoundException } from '@nestjs/common';

import { PERMISSION_CATALOG } from '../../common/constants/permissions.constants';
import { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';

describe('RbacService', () => {
  let service: RbacService;
  let repository: jest.Mocked<
    Pick<RbacRepository, 'findById'>
  >;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
    };

    service = new RbacService(
      repository as unknown as RbacRepository,
    );
  });

  describe('findRoleById', () => {
    it('should return a role belonging to the requested organization', async () => {
      const role = {
        id: 'role-123',
        organizationId: 'organization-123',
        name: 'Branch Manager',
        permissions: ['product.view'],
      };

      repository.findById.mockResolvedValue(role as any);

      const result = await service.findRoleById(
        'organization-123',
        'role-123',
      );

      expect(repository.findById).toHaveBeenCalledWith(
        'organization-123',
        'role-123',
      );
      expect(result).toEqual(role);
    });

    it('should throw NotFoundException when the role does not exist', async () => {
      repository.findById.mockResolvedValue(null as any);

      await expect(
        service.findRoleById(
          'organization-123',
          'missing-role',
        ),
      ).rejects.toThrow(
        new NotFoundException('Role not found.'),
      );
    });
  });

  describe('getRolePermissions', () => {
    it('should return the permissions assigned to the role', async () => {
      const permissions = [
        'product.view',
        'product.organize',
      ];

      repository.findById.mockResolvedValue({
        id: 'role-123',
        permissions,
      } as any);

      const result = await service.getRolePermissions(
        'organization-123',
        'role-123',
      );

      expect(result).toEqual(permissions);
    });

    it('should throw NotFoundException when the role does not exist', async () => {
      repository.findById.mockResolvedValue(null as any);

      await expect(
        service.getRolePermissions(
          'organization-123',
          'missing-role',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPermissionCatalog', () => {
    it('should return the complete permission catalog', () => {
      const result = service.getPermissionCatalog();

      expect(result).toEqual(PERMISSION_CATALOG);
    });

    it('should return a separate array instead of exposing the original catalog', () => {
      const result = service.getPermissionCatalog();

      expect(result).not.toBe(PERMISSION_CATALOG);
    });
  });
});