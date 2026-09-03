import { Module } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service.js';
import { AuditController } from './audit.controller.js';
import { TenantContextService } from '../../common/tenant/tenant-context.service.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';

@Module({
  controllers: [AuditController],
  providers: [AuditService, TenantContextService, TenantGuard, PermissionsGuard],
  exports: [AuditService],
})
export class AuditModule {}
