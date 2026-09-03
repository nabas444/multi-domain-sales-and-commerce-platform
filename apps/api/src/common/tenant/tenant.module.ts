import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service.js';
import { TenantGuard } from './tenant.guard.js';

@Global()
@Module({
  providers: [TenantContextService, TenantGuard],
  exports: [TenantContextService, TenantGuard],
})
export class TenantModule {}
