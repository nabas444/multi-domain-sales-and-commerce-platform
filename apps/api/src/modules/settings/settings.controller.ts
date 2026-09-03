import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('definitions')
  @UseGuards(JwtAuthGuard)
  async getDefinitions(
    @Query('category') category?: string,
    @Query('sensitivity') sensitivity?: string
  ) {
    return this.settingsService.getDefinitions(category, sensitivity);
  }

  @Get('definitions/:key')
  @UseGuards(JwtAuthGuard)
  async getDefinitionByKey(@Param('key') key: string) {
    return this.settingsService.getDefinitionByKey(key);
  }

  @Get('resolve/:key')
  @UseGuards(JwtAuthGuard)
  async resolveSetting(
    @Param('key') key: string,
    @Query('domainId') domainId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @CurrentUser() user?: UserContext
  ) {
    return this.settingsService.resolveSetting(key, {
      domainId,
      organizationId: organizationId || user?.activeOrganizationId || undefined,
      branchId: branchId || user?.activeBranchId || undefined,
      userId: user?.id,
      categoryId,
    });
  }

  @Post('values/:key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async setSettingValue(
    @Param('key') key: string,
    @Body() body: { scope: string; scopeId?: string; value: unknown; reason?: string },
    @CurrentUser() user: UserContext
  ) {
    return this.settingsService.setSettingValue(
      key,
      body.scope,
      body.scopeId || 'GLOBAL',
      body.value,
      user.id,
      body.reason
    );
  }

  @Get('history/:key')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async getSettingHistory(
    @Param('key') key: string,
    @Query('scope') scope = 'PLATFORM',
    @Query('scopeId') scopeId = 'GLOBAL'
  ) {
    return this.settingsService.getSettingHistory(key, scope, scopeId);
  }

  @Get('feature-flags')
  async getFeatureFlags(
    @Query('scope') scope = 'PLATFORM',
    @Query('scopeId') scopeId = 'GLOBAL'
  ) {
    return this.settingsService.getFeatureFlags(scope, scopeId);
  }

  @Post('feature-flags')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.manage')
  async setFeatureFlag(
    @Body()
    body: {
      key: string;
      name: string;
      state: string;
      description?: string;
      scope?: string;
      scopeId?: string;
    }
  ) {
    return this.settingsService.setFeatureFlag(
      body.key,
      body.name,
      body.state,
      body.description,
      body.scope || 'PLATFORM',
      body.scopeId || 'GLOBAL'
    );
  }

  @Get('theme')
  async getTheme(
    @Query('scope') scope = 'PLATFORM',
    @Query('scopeId') scopeId = 'GLOBAL'
  ) {
    return this.settingsService.getTheme(scope, scopeId);
  }

  @Post('theme')
  @UseGuards(JwtAuthGuard)
  async saveTheme(
    @Body()
    body: {
      name: string;
      scope?: string;
      scopeId?: string;
      palette: string;
      tokens: Record<string, unknown>;
    }
  ) {
    return this.settingsService.saveTheme(
      body.name,
      body.scope || 'PLATFORM',
      body.scopeId || 'GLOBAL',
      body.palette,
      body.tokens
    );
  }
}
