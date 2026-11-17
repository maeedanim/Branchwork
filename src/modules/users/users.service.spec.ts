
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { CryptoService } from '../../common/services/crypto.service';
import { BranchesService } from '../branches/branches.service';
import { RbacService } from '../auth/rbac.service';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

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

describe('UsersService', () => {
  let service: UsersService;

  let usersRepository: jest.Mocked<
    Pick<
      UsersRepository,
      | 'createOwner'
      | 'createStaff'
      | 'findByEmail'
      | 'findAuthUserById'
      | 'findById'
      | 'findAllStaff'
      | 'findStaffById'
      | 'updateStaff'
      | 'deleteStaff'
    >
  >;

  let branchesService: jest.Mocked<
    Pick<BranchesService, 'findById'>
  >;

  let rbacService: jest.Mocked<
    Pick<RbacService, 'findRoleById'>
  >;

  let cryptoService: jest.Mocked<
    Pick<CryptoService, 'hashPassword'>
  >;

  const organizationId = 'organization-123';
  const branchId = 'branch-123';
  const anotherBranchId = 'branch-456';
  const roleId = 'role-123';
  const anotherRoleId = 'role-456';
  const userId = 'staff-123';

  const owner = {
    id: 'owner-123',
    organizationId,
    name: 'John Owner',
    email: 'owner@example.com',
    userType: 'OWNER',
    passwordHash: 'hashed-owner-password',
    branchId: null,
    roleId: null,
  };

  const staff = {
    id: userId,
    organizationId,
    name: 'John Staff',
    email: 'staff@example.com',
    userType: 'STAFF',
    passwordHash: 'hashed-staff-password',
    branchId,
    roleId,
  };

  const requesterOwner = {
    id: owner.id,
    organizationId,
    userType: 'OWNER',
    branchId: null,
    roleId: null,
  };

  const requesterStaff = {
    id: 'another-staff-123',
    organizationId,
    userType: 'STAFF',
    branchId,
    roleId,
  };

  const pagination = {
    page: 1,
    limit: 10,
  };

  beforeEach(() => {
    usersRepository = {
      createOwner: jest.fn(),
      createStaff: jest.fn(),
      findByEmail: jest.fn(),
      findAuthUserById: jest.fn(),
      findById: jest.fn(),
      findAllStaff: jest.fn(),
      findStaffById: jest.fn(),
      updateStaff: jest.fn(),
      deleteStaff: jest.fn(),
    };

    branchesService = {
      findById: jest.fn(),
    };

    rbacService = {
      findRoleById: jest.fn(),
    };

    cryptoService = {
      hashPassword: jest.fn(),
    };

    service = new UsersService(
      usersRepository as unknown as UsersRepository,
      branchesService as unknown as BranchesService,
      rbacService as unknown as RbacService,
      cryptoService as unknown as CryptoService,
    );
  });

  describe('createOwner', () => {
    it('should create an owner successfully', async () => {
      usersRepository.createOwner.mockResolvedValue(
        owner as any,
      );

      const result = await service.createOwner(
        organizationId,
        owner.name,
        owner.email,
        owner.passwordHash,
      );

      expect(usersRepository.createOwner).toHaveBeenCalledWith(
        organizationId,
        owner.name,
        owner.email,
        owner.passwordHash,
        undefined,
      );

      expect(result).toEqual(owner);
    });

    it('should pass the transaction manager to the repository', async () => {
      const manager = {} as any;

      usersRepository.createOwner.mockResolvedValue(
        owner as any,
      );

      await service.createOwner(
        organizationId,
        owner.name,
        owner.email,
        owner.passwordHash,
        manager,
      );

      expect(usersRepository.createOwner).toHaveBeenCalledWith(
        organizationId,
        owner.name,
        owner.email,
        owner.passwordHash,
        manager,
      );
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.createOwner(
          '',
          owner.name,
          owner.email,
          owner.passwordHash,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Organization ID is required.',
        ),
      );

      expect(usersRepository.createOwner).not.toHaveBeenCalled();
    });

    it('should map duplicate email errors to ConflictException', async () => {
      usersRepository.createOwner.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.createOwner(
          organizationId,
          owner.name,
          owner.email,
          owner.passwordHash,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'A user with this email already exists.',
        ),
      );
    });

    it('should propagate unexpected errors', async () => {
      const error = new Error('Unexpected repository error.');

      usersRepository.createOwner.mockRejectedValue(error);

      await expect(
        service.createOwner(
          organizationId,
          owner.name,
          owner.email,
          owner.passwordHash,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('createStaff', () => {
    const dto = {
      name: 'John Staff',
      email: 'staff@example.com',
      password: 'StrongPassword123!',
      branchId,
      roleId,
    };

    it('should create staff successfully', async () => {
      cryptoService.hashPassword.mockResolvedValue(
        'hashed-password',
      );

      usersRepository.createStaff.mockResolvedValue(
        staff as any,
      );

      const result = await service.createStaff(
        organizationId,
        dto as any,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );

      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );

      expect(cryptoService.hashPassword).toHaveBeenCalledWith(
        dto.password,
      );

      expect(usersRepository.createStaff).toHaveBeenCalledWith(
        organizationId,
        dto.name,
        dto.email,
        'hashed-password',
        branchId,
        roleId,
      );

      expect(result).toEqual(staff);
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.createStaff('', dto as any),
      ).rejects.toThrow(
        new BadRequestException(
          'Organization ID is required.',
        ),
      );

      expect(branchesService.findById).not.toHaveBeenCalled();
      expect(usersRepository.createStaff).not.toHaveBeenCalled();
    });

    it('should reject an empty branch ID', async () => {
      await expect(
        service.createStaff(organizationId, {
          ...dto,
          branchId: '',
        } as any),
      ).rejects.toThrow(
        new BadRequestException('Branch ID is required.'),
      );

      expect(branchesService.findById).not.toHaveBeenCalled();
      expect(usersRepository.createStaff).not.toHaveBeenCalled();
    });

    it('should reject an empty role ID', async () => {
      await expect(
        service.createStaff(organizationId, {
          ...dto,
          roleId: '',
        } as any),
      ).rejects.toThrow(
        new BadRequestException('Role ID is required.'),
      );

      expect(rbacService.findRoleById).not.toHaveBeenCalled();
      expect(usersRepository.createStaff).not.toHaveBeenCalled();
    });

    it('should not create staff when the branch does not belong to the organization', async () => {
      branchesService.findById.mockRejectedValue(
        new NotFoundException('Branch not found.'),
      );

      await expect(
        service.createStaff(organizationId, dto as any),
      ).rejects.toThrow(NotFoundException);

      expect(rbacService.findRoleById).not.toHaveBeenCalled();
      expect(cryptoService.hashPassword).not.toHaveBeenCalled();
      expect(usersRepository.createStaff).not.toHaveBeenCalled();
    });

    it('should not create staff when the role does not belong to the organization', async () => {
      rbacService.findRoleById.mockRejectedValue(
        new NotFoundException('Role not found.'),
      );

      await expect(
        service.createStaff(organizationId, dto as any),
      ).rejects.toThrow(NotFoundException);

      expect(cryptoService.hashPassword).not.toHaveBeenCalled();
      expect(usersRepository.createStaff).not.toHaveBeenCalled();
    });

    it('should not persist staff when password hashing fails', async () => {
      const error = new Error('Password hashing failed.');

      cryptoService.hashPassword.mockRejectedValue(error);

      await expect(
        service.createStaff(organizationId, dto as any),
      ).rejects.toThrow(error);

      expect(usersRepository.createStaff).not.toHaveBeenCalled();
    });

    it('should map duplicate email errors to ConflictException', async () => {
      cryptoService.hashPassword.mockResolvedValue(
        'hashed-password',
      );

      usersRepository.createStaff.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.createStaff(organizationId, dto as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user matching the email', async () => {
      usersRepository.findByEmail.mockResolvedValue(
        owner as any,
      );

      const result = await service.findByEmail(owner.email);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        owner.email,
      );

      expect(result).toEqual(owner);
    });

    it('should return null when no user matches the email', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail(
        'unknown@example.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAuthUserById', () => {
    it('should return the authentication user', async () => {
      usersRepository.findAuthUserById.mockResolvedValue(
        staff as any,
      );

      const result = await service.findAuthUserById(userId);

      expect(
        usersRepository.findAuthUserById,
      ).toHaveBeenCalledWith(userId);

      expect(result).toEqual(staff);
    });

    it('should return null when the user does not exist', async () => {
      usersRepository.findAuthUserById.mockResolvedValue(null);

      const result = await service.findAuthUserById(
        'unknown-user',
      );

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user within the organization', async () => {
      usersRepository.findById.mockResolvedValue(
        staff as any,
      );

      const result = await service.findById(
        organizationId,
        userId,
      );

      expect(usersRepository.findById).toHaveBeenCalledWith(
        organizationId,
        userId,
      );

      expect(result).toEqual(staff);
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.findById('', userId),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findById).not.toHaveBeenCalled();
    });

    it('should reject an empty user ID', async () => {
      await expect(
        service.findById(organizationId, ''),
      ).rejects.toThrow(
        new BadRequestException('User ID is required.'),
      );

      expect(usersRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById(organizationId, userId),
      ).rejects.toThrow(
        new NotFoundException('User not found.'),
      );
    });
  });

  describe('findAllStaff', () => {
    it('should return staff with pagination metadata for an owner', async () => {
      usersRepository.findAllStaff.mockResolvedValue([
        [staff as any],
        25,
      ]);

      const result = await service.findAllStaff(
        requesterOwner as any,
        pagination,
      );

      expect(usersRepository.findAllStaff).toHaveBeenCalledWith(
        organizationId,
        pagination,
        undefined,
      );

      expect(result).toEqual({
        items: [staff],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should restrict staff to their assigned branch', async () => {
      usersRepository.findAllStaff.mockResolvedValue([
        [staff as any],
        1,
      ]);

      await service.findAllStaff(
        requesterStaff as any,
        pagination,
      );

      expect(usersRepository.findAllStaff).toHaveBeenCalledWith(
        organizationId,
        pagination,
        branchId,
      );
    });

    it('should reject staff without an assigned branch', async () => {
      await expect(
        service.findAllStaff(
          {
            ...requesterStaff,
            branchId: null,
          } as any,
          pagination,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Your account is not assigned to a branch.',
        ),
      );

      expect(usersRepository.findAllStaff).not.toHaveBeenCalled();
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.findAllStaff(
          {
            ...requesterOwner,
            organizationId: '',
          } as any,
          pagination,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findAllStaff).not.toHaveBeenCalled();
    });

    it('should return an empty list when no staff members exist', async () => {
      usersRepository.findAllStaff.mockResolvedValue([
        [],
        0,
      ]);

      const result = await service.findAllStaff(
        requesterOwner as any,
        pagination,
      );

      expect(result).toEqual({
        items: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  describe('findStaffById', () => {
    it('should return a staff member for an owner', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      const result = await service.findStaffById(
        requesterOwner as any,
        userId,
      );

      expect(usersRepository.findStaffById).toHaveBeenCalledWith(
        organizationId,
        userId,
        undefined,
      );

      expect(result).toEqual(staff);
    });

    it('should restrict staff lookup to the requesters branch', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      await service.findStaffById(
        requesterStaff as any,
        userId,
      );

      expect(usersRepository.findStaffById).toHaveBeenCalledWith(
        organizationId,
        userId,
        branchId,
      );
    });

    it('should reject staff without an assigned branch', async () => {
      await expect(
        service.findStaffById(
          {
            ...requesterStaff,
            branchId: null,
          } as any,
          userId,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
    });

    it('should reject an empty user ID', async () => {
      await expect(
        service.findStaffById(
          requesterOwner as any,
          '',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the staff member does not exist', async () => {
      usersRepository.findStaffById.mockResolvedValue(null);

      await expect(
        service.findStaffById(
          requesterOwner as any,
          userId,
        ),
      ).rejects.toThrow(
        new NotFoundException('Staff member not found.'),
      );
    });
  });

  describe('updateStaff', () => {
    it('should update a staff member name', async () => {
      const updatedStaff = {
        ...staff,
        name: 'Updated Name',
      };

      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.updateStaff.mockResolvedValue(
        updatedStaff as any,
      );

      const result = await service.updateStaff(
        organizationId,
        userId,
        {
          name: 'Updated Name',
        } as any,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );

      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );

      expect(usersRepository.updateStaff).toHaveBeenCalledWith(
        staff,
        {
          name: 'Updated Name',
        },
      );

      expect(result).toEqual(updatedStaff);
    });

    it('should update the assigned branch', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.updateStaff.mockResolvedValue({
        ...staff,
        branchId: anotherBranchId,
      } as any);

      await service.updateStaff(
        organizationId,
        userId,
        {
          branchId: anotherBranchId,
        } as any,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        anotherBranchId,
      );

      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );

      expect(usersRepository.updateStaff).toHaveBeenCalledWith(
        staff,
        {
          branchId: anotherBranchId,
        },
      );
    });

    it('should update the assigned role', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.updateStaff.mockResolvedValue({
        ...staff,
        roleId: anotherRoleId,
      } as any);

      await service.updateStaff(
        organizationId,
        userId,
        {
          roleId: anotherRoleId,
        } as any,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );

      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        organizationId,
        anotherRoleId,
      );

      expect(usersRepository.updateStaff).toHaveBeenCalledWith(
        staff,
        {
          roleId: anotherRoleId,
        },
      );
    });

    it('should update multiple fields together', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.updateStaff.mockResolvedValue({
        ...staff,
        name: 'Updated Name',
        branchId: anotherBranchId,
        roleId: anotherRoleId,
      } as any);

      await service.updateStaff(
        organizationId,
        userId,
        {
          name: 'Updated Name',
          branchId: anotherBranchId,
          roleId: anotherRoleId,
        } as any,
      );

      expect(usersRepository.updateStaff).toHaveBeenCalledWith(
        staff,
        {
          name: 'Updated Name',
          branchId: anotherBranchId,
          roleId: anotherRoleId,
        },
      );
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.updateStaff('', userId, {
          name: 'Updated Name',
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
    });

    it('should reject an empty user ID', async () => {
      await expect(
        service.updateStaff(organizationId, '', {
          name: 'Updated Name',
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
    });

    it('should reject an empty update DTO', async () => {
      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {} as any,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'At least one field must be provided.',
        ),
      );

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
      expect(usersRepository.updateStaff).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the staff member does not exist', async () => {
      usersRepository.findStaffById.mockResolvedValue(null);

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            name: 'Updated Name',
          } as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('Staff member not found.'),
      );

      expect(branchesService.findById).not.toHaveBeenCalled();
      expect(usersRepository.updateStaff).not.toHaveBeenCalled();
    });

    it('should reject an update when the resulting branch is missing', async () => {
      usersRepository.findStaffById.mockResolvedValue({
        ...staff,
        branchId: null,
      } as any);

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            name: 'Updated Name',
          } as any,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Staff members must have both a branch and a role.',
        ),
      );

      expect(branchesService.findById).not.toHaveBeenCalled();
      expect(usersRepository.updateStaff).not.toHaveBeenCalled();
    });

    it('should reject an update when the resulting role is missing', async () => {
      usersRepository.findStaffById.mockResolvedValue({
        ...staff,
        roleId: null,
      } as any);

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            name: 'Updated Name',
          } as any,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(branchesService.findById).not.toHaveBeenCalled();
      expect(usersRepository.updateStaff).not.toHaveBeenCalled();
    });

    it('should not update staff when the new branch is invalid', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      branchesService.findById.mockRejectedValue(
        new NotFoundException('Branch not found.'),
      );

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            branchId: anotherBranchId,
          } as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(rbacService.findRoleById).not.toHaveBeenCalled();
      expect(usersRepository.updateStaff).not.toHaveBeenCalled();
    });

    it('should not update staff when the new role is invalid', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      rbacService.findRoleById.mockRejectedValue(
        new NotFoundException('Role not found.'),
      );

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            roleId: anotherRoleId,
          } as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(usersRepository.updateStaff).not.toHaveBeenCalled();
    });

    it('should map duplicate email database errors to ConflictException', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.updateStaff.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            name: 'Updated Name',
          } as any,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected update errors', async () => {
      const error = new Error('Unexpected update error.');

      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.updateStaff.mockRejectedValue(error);

      await expect(
        service.updateStaff(
          organizationId,
          userId,
          {
            name: 'Updated Name',
          } as any,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('deleteStaff', () => {
    it('should delete an existing staff member', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.deleteStaff.mockResolvedValue(undefined);

      await expect(
        service.deleteStaff(organizationId, userId),
      ).resolves.toBeUndefined();

      expect(usersRepository.findStaffById).toHaveBeenCalledWith(
        organizationId,
        userId,
      );

      expect(usersRepository.deleteStaff).toHaveBeenCalledWith(
        organizationId,
        userId,
      );
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.deleteStaff('', userId),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
      expect(usersRepository.deleteStaff).not.toHaveBeenCalled();
    });

    it('should reject an empty user ID', async () => {
      await expect(
        service.deleteStaff(organizationId, ''),
      ).rejects.toThrow(BadRequestException);

      expect(usersRepository.findStaffById).not.toHaveBeenCalled();
      expect(usersRepository.deleteStaff).not.toHaveBeenCalled();
    });

    it('should not delete a staff member that does not exist', async () => {
      usersRepository.findStaffById.mockResolvedValue(null);

      await expect(
        service.deleteStaff(organizationId, userId),
      ).rejects.toThrow(
        new NotFoundException('Staff member not found.'),
      );

      expect(usersRepository.deleteStaff).not.toHaveBeenCalled();
    });

    it('should map foreign key database errors to ConflictException', async () => {
      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.deleteStaff.mockRejectedValue(
        createQueryFailedError('23503'),
      );

      await expect(
        service.deleteStaff(organizationId, userId),
      ).rejects.toThrow(
        new ConflictException(
          'This record is currently in use and cannot be modified or deleted.',
        ),
      );
    });

    it('should propagate unexpected deletion errors', async () => {
      const error = new Error('Unexpected deletion error.');

      usersRepository.findStaffById.mockResolvedValue(
        staff as any,
      );

      usersRepository.deleteStaff.mockRejectedValue(error);

      await expect(
        service.deleteStaff(organizationId, userId),
      ).rejects.toThrow(error);
    });
  });
});
