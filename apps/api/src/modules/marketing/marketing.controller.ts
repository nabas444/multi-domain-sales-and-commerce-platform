import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('campaigns')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listCampaigns(@CurrentUser() user: UserContext) {
    return this.marketingService.listCampaigns(user.activeOrganizationId!);
  }

  @Post('campaigns')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createCampaign(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.marketingService.createCampaign(user.activeOrganizationId!, body, user.id);
  }

  @Get('landing-pages')
  async listLandingPages(@Query('domainId') domainId?: string) {
    return this.marketingService.listLandingPages(domainId);
  }

  @Get('landing-pages/:slug')
  async getLandingPage(@Param('slug') slug: string) {
    return this.marketingService.getLandingPageBySlug(slug);
  }

  @Post('landing-pages')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async saveLandingPage(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.marketingService.saveLandingPage(body, user.id);
  }

  @Get('webhooks')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listWebhooks(@CurrentUser() user: UserContext) {
    return this.marketingService.listWebhooks(user.activeOrganizationId!);
  }

  @Post('webhooks')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createWebhook(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.marketingService.createWebhook(user.activeOrganizationId!, body, user.id);
  }

  @Get('imports')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listImports(@CurrentUser() user: UserContext) {
    return this.marketingService.listImportJobs(user.activeOrganizationId!);
  }

  @Post('imports')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createImport(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.marketingService.createImportJob(user.activeOrganizationId!, body, user.id);
  }
}
