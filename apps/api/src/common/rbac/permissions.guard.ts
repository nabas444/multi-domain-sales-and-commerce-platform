import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator.js';
import { UserContext } from '@platform/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user }: { user: UserContext } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Access denied: Authentication context missing');
    }

    // Super Admin has unrestricted permissions
    if (user.isSuperAdmin) {
      return true;
    }

    const userPermissions = new Set(user.permissions || []);
    const hasAll = requiredPermissions.every((perm) => userPermissions.has(perm));

    if (!hasAll) {
      const missing = requiredPermissions.filter((p) => !userPermissions.has(p));
      throw new ForbiddenException(
        `Access denied: Missing required permission(s): ${missing.join(', ')}`
      );
    }

    return true;
  }
}
