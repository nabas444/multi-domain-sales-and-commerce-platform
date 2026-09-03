import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@platform/types';

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: UserContext = request.user;
    return data ? user?.[data] : user;
  }
);
