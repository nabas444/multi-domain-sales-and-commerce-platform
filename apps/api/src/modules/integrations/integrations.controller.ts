import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { IntegrationsService, RegisterWebhookDto } from './integrations.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('integrations')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('webhooks')
  @RequirePermissions('integration.read')
  async listWebhooks(@CurrentUser() user: UserContext) {
    return this.integrationsService.listWebhooks(user.activeOrganizationId!);
  }

  @Post('webhooks')
  @RequirePermissions('integration.manage')
  async registerWebhook(
    @Body() body: RegisterWebhookDto,
    @CurrentUser() user: UserContext
  ) {
    return this.integrationsService.registerWebhook(
      user.activeOrganizationId!,
      body,
      user.id
    );
  }

  @Delete('webhooks/:id')
  @RequirePermissions('integration.manage')
  async deleteWebhook(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ) {
    return this.integrationsService.deleteWebhook(
      id,
      user.activeOrganizationId!,
      user.id
    );
  }

  @Get('webhooks/:id/deliveries')
  @RequirePermissions('integration.read')
  async getDeliveries(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ) {
    return this.integrationsService.getWebhookDeliveries(
      id,
      user.activeOrganizationId!
    );
  }

  @Post('events/simulate')
  @RequirePermissions('integration.manage')
  async simulateEvent(
    @Body() body: { eventType: string; payload: Record<string, any> },
    @CurrentUser() user: UserContext
  ) {
    return this.integrationsService.emitDomainEvent({
      organizationId: user.activeOrganizationId!,
      eventType: body.eventType,
      payload: body.payload,
    });
  }
}
