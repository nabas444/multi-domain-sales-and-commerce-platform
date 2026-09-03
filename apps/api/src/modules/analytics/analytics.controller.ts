import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: UserContext) {
    const orgId = user.isSuperAdmin ? undefined : user.activeOrganizationId;
    return this.analyticsService.getExecutiveOverview(orgId || undefined);
  }

  @Get('funnel')
  async getFunnel(@CurrentUser() user: UserContext) {
    const orgId = user.isSuperAdmin ? undefined : user.activeOrganizationId;
    return this.analyticsService.getSalesFunnelMetrics(orgId || undefined);
  }

  @Get('domains')
  async getDomainPerformance() {
    return this.analyticsService.getDomainCategoryPerformance();
  }

  @Get('attribution')
  async getAttribution(@CurrentUser() user: UserContext) {
    const orgId = user.isSuperAdmin ? undefined : user.activeOrganizationId;
    return this.analyticsService.getAttributionMetrics(orgId || undefined);
  }
}
