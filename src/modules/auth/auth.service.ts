
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CryptoService } from '../../common/services/crypto.service';
import { TransactionService } from '../../common/services/transaction.service';
import { PERMISSION_CATALOG } from '../../common/constants/permissions.constants';

import { OrganizationService } from '../organization/organization.service';
import { UsersService } from '../users/users.service';
import { RbacService } from './rbac.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cryptoService: CryptoService,
    private readonly transactionService: TransactionService,
    private readonly organizationService: OrganizationService,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await this.cryptoService.hashPassword(
      dto.password,
    );

    // Create the organization and owner atomically.
    const result = await this.transactionService.runInTransaction(
      async (manager) => {
        const organization = await this.organizationService.create(
          dto.organizationName,
          manager,
        );

        const user = await this.usersService.createOwner(
          organization.id,
          dto.name,
          dto.email,
          passwordHash,
          manager,
        );

        return { organization, user };
      },
    );

    const accessToken = await this.generateToken(
      result.user.id,
    );

    return {
      accessToken,
      user: {
        id: result.user.id,
        organizationId: result.user.organizationId,
        name: result.user.name,
        email: result.user.email,
        userType: result.user.userType,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(
      dto.email,
    );

    // Use the same response for an unknown email and wrong password.
    if (
      !user ||
      !user.passwordHash ||
      !(await this.cryptoService.comparePassword(
        dto.password,
        user.passwordHash,
      ))
    ) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    const accessToken = await this.generateToken(user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        organizationId: user.organizationId,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findAuthUserById(
      userId,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired access token.',
      );
    }

    // Owners have access to the complete permission catalog.
    if (user.userType === 'OWNER') {
      return {
        id: user.id,
        organizationId: user.organizationId,
        userType: user.userType,
        name: user.name,
        branchId: null,
        roleName: null,
        permissions: [...PERMISSION_CATALOG],
      };
    }

    if (!user.roleId) {
      throw new ForbiddenException(
        'Your account does not have an assigned role.',
      );
    }

    const role = await this.rbacService.findRoleById(
      user.organizationId,
      user.roleId,
    );

    return {
      id: user.id,
      organizationId: user.organizationId,
      userType: user.userType,
      name: user.name,
      branchId: user.branchId,
      roleName: role.name,
      permissions: role.permissions,
    };
  }

  private async generateToken(userId: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
    });
  }
}
