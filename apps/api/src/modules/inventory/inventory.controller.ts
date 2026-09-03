import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('listings')
  async listListings(
    @Query('domainId') domainId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('priceMin') priceMin?: string,
    @Query('priceMax') priceMax?: string,
    @Query('search') search?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.inventoryService.listListings({
      domainId,
      categoryId,
      organizationId,
      status,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      search,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('listings/:idOrSlug')
  async getListing(@Param('idOrSlug') idOrSlug: string) {
    return this.inventoryService.getListingByIdOrSlug(idOrSlug);
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('listing.create')
  async createListing(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    const orgId = user.activeOrganizationId!;
    return this.inventoryService.createListing(orgId, body, user.id);
  }

  @Post('listings/:id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  async transitionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.inventoryService.transitionStatus(
      id,
      body.status,
      user.activeOrganizationId || '',
      user.isSuperAdmin,
      user.id,
      body.notes
    );
  }

  @Get('facets')
  async getFacets(
    @Query('domainId') domainId?: string,
    @Query('categoryId') categoryId?: string
  ) {
    return this.inventoryService.getFacets(domainId, categoryId);
  }

  @Post('media/presign')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getPresignedUpload(
    @Body() body: { fileName: string; mimeType: string; role?: string; mediaType?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.inventoryService.generatePresignedMediaUpload(
      user.activeOrganizationId!,
      body,
      user.id
    );
  }

  @Post('media/confirm')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async confirmUpload(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.inventoryService.confirmMediaUpload(
      user.activeOrganizationId!,
      body,
      user.id
    );
  }

  @Post('media')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async uploadMedia(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.inventoryService.uploadMedia(user.activeOrganizationId!, body, user.id);
  }

  @Get('media/:entityType/:entityId')
  async getEntityMedia(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string
  ) {
    return this.inventoryService.getEntityMedia(entityType, entityId);
  }
}
