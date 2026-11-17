
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CryptoService } from '../../common/services/crypto.service';
import { TransactionService } from '../../common/services/transaction.service';
import { PERMISSION_CATALOG } from '../../common/constants/permissions.constants';
import { OrganizationService } from '../organization/organization.service';
import { UsersService } from '../users/users.service';
import { RbacService } from './rbac.service';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  let jwtService: jest.Mocked<
    Pick<JwtService, 'signAsync'>
  >;

  let cryptoService: jest.Mocked<
    Pick<CryptoService, 'hashPassword' | 'comparePassword'>
  >;

  let transactionService: jest.Mocked<
    Pick<TransactionService, 'runInTransaction'>
  >;

  let organizationService: jest.Mocked<
    Pick<OrganizationService, 'create'>
  >;

  let usersService: jest.Mocked<
    Pick<
      UsersService,
      'createOwner' | 'findByEmail' | 'findAuthUserById'
    >
  >;

  let rbacService: jest.Mocked<
    Pick<RbacService, 'findRoleById'>
  >;

  const organizationId = 'organization-123';
  const userId = 'user-123';
  const roleId = 'role-123';
  const manager = {} as any;

  const owner = {
    id: userId,
    organizationId,
    name: 'John Owner',
    email: 'owner@example.com',
    userType: 'OWNER',
    passwordHash: 'hashed-password',
  };

  const staff = {
    id: 'staff-123',
    organizationId,
    name: 'John Staff',
    email: 'staff@example.com',
    userType: 'STAFF',
    branchId: 'branch-123',
    roleId,
    passwordHash: 'hashed-password',
  };

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
    };

    cryptoService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };

    transactionService = {
      runInTransaction: jest.fn(),
    };

    organizationService = {
      create: jest.fn(),
    };

    usersService = {
      createOwner: jest.fn(),
      findByEmail: jest.fn(),
      findAuthUserById: jest.fn(),
    };

    rbacService = {
      findRoleById: jest.fn(),
    };

    service = new AuthService(
      jwtService as unknown as JwtService,
      cryptoService as unknown as CryptoService,
      transactionService as unknown as TransactionService,
      organizationService as unknown as OrganizationService,
      usersService as unknown as UsersService,
      rbacService as unknown as RbacService,
    );
  });

  describe('register', () => {
    it('should register an organization and its owner successfully', async () => {
      const dto = {
        organizationName: 'Branchwork',
        name: 'John Owner',
        email: 'owner@example.com',
        password: 'StrongPassword123!',
      };

      const organization = {
        id: organizationId,
        name: dto.organizationName,
      };

      const passwordHash = 'hashed-password';
      const accessToken = 'generated-access-token';

      cryptoService.hashPassword.mockResolvedValue(passwordHash);

      organizationService.create.mockResolvedValue(
        organization as any,
      );

      usersService.createOwner.mockResolvedValue(
        owner as any,
      );

      transactionService.runInTransaction.mockImplementation(
        async (callback) => callback(manager),
      );

      jwtService.signAsync.mockResolvedValue(accessToken);

      const result = await service.register(dto as any);

      expect(cryptoService.hashPassword).toHaveBeenCalledWith(
        dto.password,
      );

      expect(transactionService.runInTransaction).toHaveBeenCalledTimes(
        1,
      );

      expect(organizationService.create).toHaveBeenCalledWith(
        dto.organizationName,
        manager,
      );

      expect(usersService.createOwner).toHaveBeenCalledWith(
        organizationId,
        dto.name,
        dto.email,
        passwordHash,
        manager,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: userId,
      });

      expect(result).toEqual({
        accessToken,
        user: {
          id: userId,
          organizationId,
          name: owner.name,
          email: owner.email,
          userType: 'OWNER',
        },
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should not create an organization or owner when password hashing fails', async () => {
      const error = new Error('Password hashing failed.');

      cryptoService.hashPassword.mockRejectedValue(error);

      await expect(
        service.register({
          organizationName: 'Branchwork',
          name: 'John Owner',
          email: 'owner@example.com',
          password: 'StrongPassword123!',
        } as any),
      ).rejects.toThrow(error);

      expect(transactionService.runInTransaction).not.toHaveBeenCalled();
      expect(organizationService.create).not.toHaveBeenCalled();
      expect(usersService.createOwner).not.toHaveBeenCalled();
    });

    it('should not generate a token when the transaction fails', async () => {
      const error = new Error('Transaction failed.');

      cryptoService.hashPassword.mockResolvedValue(
        'hashed-password',
      );

      transactionService.runInTransaction.mockRejectedValue(
        error,
      );

      await expect(
        service.register({
          organizationName: 'Branchwork',
          name: 'John Owner',
          email: 'owner@example.com',
          password: 'StrongPassword123!',
        } as any),
      ).rejects.toThrow(error);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in successfully with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(
        owner as any,
      );

      cryptoService.comparePassword.mockResolvedValue(true);

      jwtService.signAsync.mockResolvedValue(
        'generated-access-token',
      );

      const result = await service.login({
        email: owner.email,
        password: 'StrongPassword123!',
      } as any);

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        owner.email,
      );

      expect(cryptoService.comparePassword).toHaveBeenCalledWith(
        'StrongPassword123!',
        owner.passwordHash,
      );

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: userId,
      });

      expect(result).toEqual({
        accessToken: 'generated-access-token',
        user: {
          id: userId,
          organizationId,
          name: owner.name,
          email: owner.email,
          userType: 'OWNER',
        },
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should reject an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'StrongPassword123!',
        } as any),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid email or password.',
        ),
      );

      expect(cryptoService.comparePassword).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should reject a user without a stored password hash', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...owner,
        passwordHash: null,
      } as any);

      await expect(
        service.login({
          email: owner.email,
          password: 'StrongPassword123!',
        } as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(cryptoService.comparePassword).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should reject an incorrect password', async () => {
      usersService.findByEmail.mockResolvedValue(
        owner as any,
      );

      cryptoService.comparePassword.mockResolvedValue(false);

      await expect(
        service.login({
          email: owner.email,
          password: 'WrongPassword123!',
        } as any),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid email or password.',
        ),
      );

      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should throw UnauthorizedException when the user does not exist', async () => {
      usersService.findAuthUserById.mockResolvedValue(null);

      await expect(
        service.getProfile(userId),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid or expired access token.',
        ),
      );

      expect(rbacService.findRoleById).not.toHaveBeenCalled();
    });

    it('should return the complete permission catalog for an owner', async () => {
      usersService.findAuthUserById.mockResolvedValue(
        owner as any,
      );

      const result = await service.getProfile(userId);

      expect(result).toEqual({
        id: userId,
        organizationId,
        userType: 'OWNER',
        name: owner.name,
        branchId: null,
        roleName: null,
        permissions: [...PERMISSION_CATALOG],
      });

      expect(rbacService.findRoleById).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when staff has no assigned role', async () => {
      usersService.findAuthUserById.mockResolvedValue({
        ...staff,
        roleId: null,
      } as any);

      await expect(
        service.getProfile(staff.id),
      ).rejects.toThrow(
        new ForbiddenException(
          'Your account does not have an assigned role.',
        ),
      );

      expect(rbacService.findRoleById).not.toHaveBeenCalled();
    });

    it('should return the role and permissions for staff', async () => {
      const permissions = [
        'product.view',
        'product.organize',
      ];

      usersService.findAuthUserById.mockResolvedValue(
        staff as any,
      );

      rbacService.findRoleById.mockResolvedValue({
        id: roleId,
        organizationId,
        name: 'Branch Manager',
        permissions,
      } as any);

      const result = await service.getProfile(staff.id);

      expect(rbacService.findRoleById).toHaveBeenCalledWith(
        organizationId,
        roleId,
      );

      expect(result).toEqual({
        id: staff.id,
        organizationId,
        userType: 'STAFF',
        name: staff.name,
        branchId: staff.branchId,
        roleName: 'Branch Manager',
        permissions,
      });
    });
  });
});
