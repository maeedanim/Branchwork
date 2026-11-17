
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import type { RequestUser } from '../interfaces/request-user.interface';

interface AuthenticatedRequest {
  user: RequestUser;
}

export const GetUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): RequestUser => {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
