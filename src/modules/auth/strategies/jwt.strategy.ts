
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { UsersService } from '../../users/users.service';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import type { RequestUser } from '../../../common/interfaces/request-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>(
        'jwt.secret',
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim()
    ) {
      throw new UnauthorizedException(
        'Invalid or expired access token.',
      );
    }

    const user = await this.usersService.findAuthUserById(
      payload.sub,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired access token.',
      );
    }

    return {
      id: user.id,
      organizationId: user.organizationId,
      userType: user.userType,
      branchId: user.branchId,
      roleId: user.roleId,
    };
  }
}
