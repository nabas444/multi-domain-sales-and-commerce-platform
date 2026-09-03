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
import { CrmService } from './crm.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('lead.read')
  async listLeads(
    @CurrentUser() user: UserContext,
    @Query('domainId') domainId?: string,
    @Query('assignedAgentId') assignedAgentId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string
  ) {
    return this.crmService.listLeads(user.activeOrganizationId!, {
      domainId,
      assignedAgentId,
      status,
      priority,
    });
  }

  @Get('leads/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lead.read')
  async getLead(@Param('id') id: string, @CurrentUser() user: UserContext) {
    return this.crmService.getLeadById(id, user.activeOrganizationId || '', user.isSuperAdmin);
  }

  @Post('leads')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('lead.create')
  async createLead(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.crmService.createLead(user.activeOrganizationId!, body, user.id);
  }

  @Post('public-inquiry')
  async createPublicInquiry(@Body() body: { organizationId: string; domainId: string; customer: any; listingId?: string; inquiryMessage?: string }) {
    return this.crmService.createLead(body.organizationId, body);
  }

  @Put('leads/:id/status')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('lead.update')
  async updateLeadStatus(
    @Param('id') id: string,
    @Body() body: { status: string; lostReason?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.crmService.updateLeadStatus(
      id,
      body.status,
      user.activeOrganizationId!,
      user.id,
      body.lostReason
    );
  }

  @Post('leads/:id/activities')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('crm.activity.create')
  async addActivity(
    @Param('id') id: string,
    @Body() body: { type: string; subject: string; body: string },
    @CurrentUser() user: UserContext
  ) {
    return this.crmService.addActivity(
      id,
      user.activeOrganizationId!,
      body.type,
      body.subject,
      body.body,
      user.id
    );
  }

  @Get('appointments')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('appointment.read')
  async listAppointments(
    @CurrentUser() user: UserContext,
    @Query('agentId') agentId?: string
  ) {
    return this.crmService.listAppointments(user.activeOrganizationId!, agentId);
  }

  @Post('appointments')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('appointment.create')
  async scheduleAppointment(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.crmService.scheduleAppointment(user.activeOrganizationId!, body, user.id);
  }

  @Get('pipelines')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listPipelines(
    @CurrentUser() user: UserContext,
    @Query('domainId') domainId?: string
  ) {
    return this.crmService.listPipelines(user.activeOrganizationId!, domainId);
  }

  @Get('deals')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listDeals(
    @CurrentUser() user: UserContext,
    @Query('pipelineId') pipelineId?: string
  ) {
    return this.crmService.listDeals(user.activeOrganizationId!, pipelineId);
  }

  @Post('deals')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createDeal(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.crmService.createDeal(user.activeOrganizationId!, body, user.id);
  }
}
