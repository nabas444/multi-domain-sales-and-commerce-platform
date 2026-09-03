import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantContextService } from './tenant-context.service.js';
import { UserContext } from '@platform/types';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContextService: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user: UserContext = req.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const requestedTenantHeader = req.headers['x-tenant-id'] as string | undefined;

    let targetOrgId = user.activeOrganizationId;

    if (user.isSuperAdmin) {
      // Super Admin can specify any tenant via header, or default to their active organization
      targetOrgId = requestedTenantHeader || user.activeOrganizationId || null;
    } else {
      // Non-super-admin cannot spoof x-tenant-id
      if (requestedTenantHeader && requestedTenantHeader !== user.activeOrganizationId) {
        throw new ForbiddenException(
          'Cross-tenant access denied: You are not authorized to access records outside your active organization.'
        );
      }
    }

    if (!targetOrgId) {
      throw new ForbiddenException('Tenant context required: No active organization identified.');
    }

    // Populate AsyncLocalStorage context for downstream services/repositories
    const tenantCtx = {
      userId: user.id,
      userEmail: user.email,
      organizationId: targetOrgId,
      branchId: user.activeBranchId || null,
      isSuperAdmin: user.isSuperAdmin,
      roles: user.roles,
      permissions: user.permissions,
    };

    req.tenantContext = tenantCtx;
    return true;
  }
}
