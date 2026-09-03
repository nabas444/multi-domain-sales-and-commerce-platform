import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { PermissionsGuard } from '../../common/rbac/permissions.guard.js';
import { RequirePermissions } from '../../common/rbac/require-permissions.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';
import {
  CreateOrganizationSchema,
  CreateBranchSchema,
  AddMemberSchema,
} from '@platform/validation';
import { RequestWithCorrelationId } from '../../common/interceptors/correlation-id.middleware.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  async createOrganization(
    @Body() body: unknown,
    @CurrentUser() user: UserContext,
    @Req() req: RequestWithCorrelationId
  ) {
    const validated = CreateOrganizationSchema.parse(body);
    return await this.orgsService.createOrganization(
      validated,
      user.id,
      user.isSuperAdmin,
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId: req.correlationId,
      }
    );
  }

  @Get()
  async listOrganizations(@CurrentUser() user: UserContext) {
    return await this.orgsService.listOrganizations(user.id, user.isSuperAdmin);
  }

  @Get(':id')
  @UseGuards(TenantGuard)
  async getOrganization(@Param('id') id: string) {
    return await this.orgsService.getOrganization(id);
  }

  @Get(':id/branches')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions('branch.read')
  async listBranches(@Param('id') id: string) {
    return await this.orgsService.listBranches(id);
  }

  @Post(':id/branches')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions('branch.create')
  async createBranch(@Param('id') id: string, @Body() body: unknown) {
    const validated = CreateBranchSchema.parse(body);
    return await this.orgsService.createBranch(id, validated);
  }

  @Get(':id/members')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions('user.read')
  async listMembers(@Param('id') id: string) {
    return await this.orgsService.listMembers(id);
  }

  @Post(':id/members')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions('user.assign_role')
  async addMember(@Param('id') id: string, @Body() body: unknown) {
    const validated = AddMemberSchema.parse(body);
    return await this.orgsService.addMember(id, validated);
  }
}
