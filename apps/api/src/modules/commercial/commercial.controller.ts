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
import { CommercialService } from './commercial.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('commercial')
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  @Get('plans')
  async listPlans() {
    return this.commercialService.listPlans();
  }

  @Get('contracts')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listContracts(@CurrentUser() user: UserContext) {
    const orgId = user.isSuperAdmin ? undefined : user.activeOrganizationId || undefined;
    return this.commercialService.listContracts(orgId);
  }

  @Get('contracts/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getContract(@Param('id') id: string, @CurrentUser() user: UserContext) {
    return this.commercialService.getContract(id, user.activeOrganizationId || undefined, user.isSuperAdmin);
  }

  @Post('fee-events/calculate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async calculateFeeEvent(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.commercialService.calculateAndPostFeeEvent(body, user.id);
  }

  @Get('ledger')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listLedger(@CurrentUser() user: UserContext, @Query('limit') limit?: string) {
    return this.commercialService.listLedgerEntries(
      user.activeOrganizationId!,
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listInvoices(@CurrentUser() user: UserContext) {
    return this.commercialService.listInvoices(user.activeOrganizationId!);
  }

  @Post('invoices')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async createInvoice(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.commercialService.createInvoice(user.activeOrganizationId!, body, user.id);
  }

  @Post('settlements/generate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async generateSettlement(
    @Body() body: { organizationId: string; periodStart: string; periodEnd: string },
    @CurrentUser() user: UserContext
  ) {
    return this.commercialService.generateSettlement(
      body.organizationId,
      body.periodStart,
      body.periodEnd,
      user.id
    );
  }

  @Post('disputes')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async fileDispute(
    @Body() body: { feeEventId: string; reason: string; requestedAdjustment?: number },
    @CurrentUser() user: UserContext
  ) {
    return this.commercialService.fileDispute(
      user.activeOrganizationId!,
      body.feeEventId,
      body.reason,
      body.requestedAdjustment,
      user.id
    );
  }

  @Put('disputes/:id/resolve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async resolveDispute(
    @Param('id') id: string,
    @Body() body: { status: 'ACCEPTED' | 'REJECTED' | 'ADJUSTED'; resolutionNotes: string },
    @CurrentUser() user: UserContext
  ) {
    return this.commercialService.resolveDispute(id, body.status, body.resolutionNotes, user.id);
  }
}
