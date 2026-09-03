import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/common/rbac/permissions.guard.js';
import { UserContext } from '@platform/types';

describe('RBAC Action Permissions Suite', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('MUST allow user with required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['listing.create']);

    const mockUser: UserContext = {
      id: 'agent-1',
      email: 'agent@apexrealty.et',
      firstName: 'Selam',
      lastName: 'Bekele',
      isSuperAdmin: false,
      activeOrganizationId: 'tenant-1',
      activeBranchId: null,
      roles: ['SALES_AGENT'],
      permissions: ['listing.read', 'listing.create'],
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('MUST reject user missing required action permission with 403 Forbidden', () => {
    // Requires branch.create which ordinary sales agent lacks
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['branch.create']);

    const mockUser: UserContext = {
      id: 'agent-1',
      email: 'agent@apexrealty.et',
      firstName: 'Selam',
      lastName: 'Bekele',
      isSuperAdmin: false,
      activeOrganizationId: 'tenant-1',
      activeBranchId: null,
      roles: ['SALES_AGENT'],
      permissions: ['listing.read', 'listing.create'],
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('MUST allow Super Admin to bypass all permission checks', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['platform.manage']);

    const mockSuperAdmin: UserContext = {
      id: 'super-admin',
      email: 'admin@platform.local',
      firstName: 'System',
      lastName: 'Admin',
      isSuperAdmin: true,
      activeOrganizationId: 'org-1',
      activeBranchId: null,
      roles: ['SUPER_ADMIN'],
      permissions: [],
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockSuperAdmin }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
