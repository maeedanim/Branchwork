
import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { ACCESS_METADATA_KEY } from '../decorators/auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const accessType = this.reflector.getAllAndOverride<string>(
      ACCESS_METADATA_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (accessType === 'PUBLIC') {
      return true;
    }

    return super.canActivate(context);
  }
}

