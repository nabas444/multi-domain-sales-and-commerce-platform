import { SystemRole } from './rbac.types.js';

export interface UserContext {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  activeOrganizationId?: string | null;
  activeBranchId?: string | null;
  roles: (SystemRole | string)[];
  permissions: string[];
}

export interface AuthSession {
  token: string;
  user: UserContext;
  expiresAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  orgId?: string | null;
  branchId?: string | null;
  isSuperAdmin: boolean;
  iat?: number;
  exp?: number;
}
