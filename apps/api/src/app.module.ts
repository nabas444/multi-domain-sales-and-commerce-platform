import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { DomainsModule } from './modules/domains/domains.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { CrmModule } from './modules/crm/crm.module.js';
import { CommercialModule } from './modules/commercial/commercial.module.js';
import { WorkflowsModule } from './modules/workflows/workflows.module.js';
import { MarketingModule } from './modules/marketing/marketing.module.js';
import { TenantModule } from './common/tenant/tenant.module.js';
import { CorrelationIdMiddleware } from './common/interceptors/correlation-id.middleware.js';

@Module({
  imports: [
    TenantModule,
    HealthModule,
    IdentityModule,
    OrganizationsModule,
    AuditModule,
    SettingsModule,
    DomainsModule,
    InventoryModule,
    CrmModule,
    CommercialModule,
    WorkflowsModule,
    MarketingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
