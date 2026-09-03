import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from '../src/common/tenant/tenant.guard.js';
import { TenantContextService } from '../src/common/tenant/tenant-context.service.js';
import { UserContext } from '@platform/types';

describe('Multi-Tenant Isolation Security Suite', () => {
  let guard: TenantGuard;
  let tenantContextService: TenantContextService;

  beforeEach(() => {
    tenantContextService = new TenantContextService();
    guard = new TenantGuard(tenantContextService);
  });

  it('MUST allow Tenant A user to access their own organization data', () => {
    const tenantAId = '11111111-1111-1111-1111-111111111111';
    const mockUser: UserContext = {
      id: 'user-tenant-a',
      email: 'user@tenant-a.com',
      firstName: 'Alice',
      lastName: 'Smith',
      isSuperAdmin: false,
      activeOrganizationId: tenantAId,
      activeBranchId: null,
      roles: ['TENANT_ADMIN'],
      permissions: ['tenant.read'],
    };

    const mockRequest = {
      user: mockUser,
      headers: {
        'x-tenant-id': tenantAId,
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const canActivate = guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
    expect((mockRequest as any).tenantContext.organizationId).toBe(tenantAId);
  });

  it('MUST block Tenant A user from accessing Tenant B data via header spoofing', () => {
    const tenantAId = '11111111-1111-1111-1111-111111111111';
    const tenantBId = '22222222-2222-2222-2222-222222222222';

    const mockUser: UserContext = {
      id: 'user-tenant-a',
      email: 'user@tenant-a.com',
      firstName: 'Alice',
      lastName: 'Smith',
      isSuperAdmin: false,
      activeOrganizationId: tenantAId,
      activeBranchId: null,
      roles: ['TENANT_ADMIN'],
      permissions: ['tenant.read'],
    };

    // Attacker attempts to spoof x-tenant-id to read Tenant B's data
    const mockRequest = {
      user: mockUser,
      headers: {
        'x-tenant-id': tenantBId,
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('ALLOWS Super Admin to switch tenant context legally via x-tenant-id header', () => {
    const tenantBId = '22222222-2222-2222-2222-222222222222';

    const mockSuperAdmin: UserContext = {
      id: 'super-admin-id',
      email: 'admin@platform.local',
      firstName: 'System',
      lastName: 'Admin',
      isSuperAdmin: true,
      activeOrganizationId: '00000000-0000-0000-0000-000000000000',
      activeBranchId: null,
      roles: ['SUPER_ADMIN'],
      permissions: ['*'],
    };

    const mockRequest = {
      user: mockSuperAdmin,
      headers: {
        'x-tenant-id': tenantBId,
      },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const canActivate = guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
    expect((mockRequest as any).tenantContext.organizationId).toBe(tenantBId);
  });
});
