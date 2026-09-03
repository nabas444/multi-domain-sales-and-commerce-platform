import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('audit')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @RequirePermissions('audit.read')
  async getLogs(
    @CurrentUser() user: UserContext,
    @Query('resource') resource?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const orgId = user.isSuperAdmin ? undefined : user.activeOrganizationId;

    return await this.auditService.queryLogs({
      organizationId: orgId,
      resource,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }
}
