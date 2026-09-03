import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DomainsService } from './domains.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  async listDomains(@Query('status') status?: string) {
    return this.domainsService.listDomains(status);
  }

  @Get(':idOrSlug')
  async getDomain(@Param('idOrSlug') idOrSlug: string) {
    return this.domainsService.getDomain(idOrSlug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('domain.create')
  async createDomain(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.domainsService.createDomain(body, user.id);
  }

  @Get(':domainId/categories')
  async listCategories(
    @Param('domainId') domainId: string,
    @Query('parentId') parentId?: string
  ) {
    return this.domainsService.listCategories(domainId, parentId);
  }

  @Get(':domainId/category-tree')
  async getCategoryTree(@Param('domainId') domainId: string) {
    return this.domainsService.getCategoryTree(domainId);
  }

  @Post(':domainId/categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('domain.update')
  async createCategory(
    @Param('domainId') domainId: string,
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.domainsService.createCategory({ ...body, domainId }, user.id);
  }

  @Get(':domainId/attributes')
  async listAttributes(
    @Param('domainId') domainId: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.domainsService.listAttributes(domainId, categoryId);
  }

  @Post(':domainId/attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('domain.update')
  async createAttribute(
    @Param('domainId') domainId: string,
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.domainsService.createAttribute({ ...body, domainId }, user.id);
  }

  @Get('categories/:categoryId/template')
  async getCategoryTemplate(@Param('categoryId') categoryId: string) {
    return this.domainsService.getCategoryTemplate(categoryId);
  }

  @Post('categories/:categoryId/template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('domain.update')
  async saveCategoryTemplate(
    @Param('categoryId') categoryId: string,
    @Body() body: any
  ) {
    return this.domainsService.saveCategoryTemplate(categoryId, body);
  }

  @Get('organizations/:orgId/permissions')
  @UseGuards(JwtAuthGuard)
  async getTenantDomains(@Param('orgId') orgId: string) {
    return this.domainsService.getTenantDomains(orgId);
  }

  @Post('organizations/:orgId/permissions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant.update')
  async setTenantDomainPermission(
    @Param('orgId') orgId: string,
    @Body() body: { domainId: string; allowedCategories?: string[]; isEnabled?: boolean }
  ) {
    return this.domainsService.setTenantDomainPermission(
      orgId,
      body.domainId,
      body.allowedCategories || ['*'],
      body.isEnabled !== false
    );
  }
}
