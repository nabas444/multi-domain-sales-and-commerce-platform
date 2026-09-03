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
import { WorkflowsService } from './workflows.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listWorkflows(
    @CurrentUser() user: UserContext,
    @Query('domainId') domainId?: string
  ) {
    return this.workflowsService.listWorkflows(domainId, user.activeOrganizationId || undefined);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async createWorkflow(
    @Body() body: any,
    @CurrentUser() user: UserContext
  ) {
    return this.workflowsService.createWorkflow(body, user.id);
  }

  @Get('forms')
  async listForms(@Query('domainId') domainId?: string) {
    return this.workflowsService.listForms(domainId);
  }

  @Get('forms/:code')
  async getForm(@Param('code') code: string) {
    return this.workflowsService.getFormByCode(code);
  }

  @Post('forms')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('domain.update')
  async createForm(@Body() body: any, @CurrentUser() user: UserContext) {
    return this.workflowsService.createForm(body, user.id);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  async listNotifications(
    @CurrentUser() user: UserContext,
    @Query('unreadOnly') unreadOnly?: string
  ) {
    return this.workflowsService.listNotifications(user.id, unreadOnly === 'true');
  }

  @Put('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  async markNotificationRead(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ) {
    return this.workflowsService.markNotificationRead(id, user.id);
  }
}
