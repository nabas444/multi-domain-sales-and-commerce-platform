import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { TenantContextService } from '../../common/tenant/tenant-context.service.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { AuditService } from '../../common/audit/audit.service.js';

@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    TenantContextService,
    TenantGuard,
    PermissionsGuard,
    AuditService,
  ],
  exports: [OrganizationsService, TenantContextService],
})
export class OrganizationsModule {}
