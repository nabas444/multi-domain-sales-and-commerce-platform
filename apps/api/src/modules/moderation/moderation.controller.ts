import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ModerationService, ModerationDecisionDto } from './moderation.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('moderation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('listings/queue')
  @RequirePermissions('listing.moderate')
  async getListingQueue(
    @Query('domainId') domainId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.moderationService.getListingModerationQueue({
      domainId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('listings/:id/decision')
  @RequirePermissions('listing.moderate')
  async reviewListing(
    @Param('id') id: string,
    @Body() body: ModerationDecisionDto,
    @CurrentUser() user: UserContext
  ) {
    return this.moderationService.reviewListing(id, body, user.id);
  }

  @Get('partners/queue')
  @RequirePermissions('tenant.manage')
  async getPartnerQueue() {
    return this.moderationService.getPartnerVerificationQueue();
  }

  @Post('partners/:id/decision')
  @RequirePermissions('tenant.manage')
  async reviewPartner(
    @Param('id') id: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'; notes?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.moderationService.reviewPartnerVerification(id, body, user.id);
  }

  @Post('documents/:id/verify')
  @RequirePermissions('listing.moderate')
  async verifyDocument(
    @Param('id') id: string,
    @Body() body: { isVerified: boolean; notes?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.moderationService.reviewDocumentVerification(id, body.isVerified, user.id, body.notes);
  }
}
