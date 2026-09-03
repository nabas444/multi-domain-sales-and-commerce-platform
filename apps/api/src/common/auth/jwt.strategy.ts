import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '@platform/config';
import { JwtPayload, UserContext } from '@platform/types';
import { dbPool } from '@platform/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.['platform_token'] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<UserContext> {
    const userRes = await dbPool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      is_super_admin: boolean;
      is_active: boolean;
    }>(
      `SELECT id, email, first_name, last_name, is_super_admin, is_active
       FROM identity.users
       WHERE id = $1 AND deleted_at IS NULL`,
      [payload.sub]
    );

    const user = userRes.rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User account is invalid or inactive');
    }

    // Fetch active membership and permissions for the target organization
    let activeOrgId = payload.orgId || null;
    let activeBranchId = payload.branchId || null;
    let roles: any[] = [];
    let permissions: string[] = [];

    if (user.is_super_admin) {
      roles = ['SUPER_ADMIN'];
      const permsRes = await dbPool.query<{ key: string }>('SELECT key FROM identity.permissions');
      permissions = permsRes.rows.map((p) => p.key);
    } else {
      const membershipRes = await dbPool.query<{
        organization_id: string;
        branch_id: string | null;
        role_code: string;
        role_id: string;
      }>(
        `SELECT m.organization_id, m.branch_id, r.code as role_code, r.id as role_id
         FROM organizations.memberships m
         JOIN identity.roles r ON m.role_id = r.id
         WHERE m.user_id = $1 AND m.is_active = TRUE AND m.deleted_at IS NULL
         ${activeOrgId ? 'AND m.organization_id = $2' : 'ORDER BY m.is_primary DESC LIMIT 1'}`,
        activeOrgId ? [user.id, activeOrgId] : [user.id]
      );

      if (membershipRes.rows.length > 0) {
        const mem = membershipRes.rows[0];
        activeOrgId = mem.organization_id;
        activeBranchId = mem.branch_id;
        roles = [mem.role_code];

        const permsRes = await dbPool.query<{ key: string }>(
          `SELECT p.key
           FROM identity.role_permissions rp
           JOIN identity.permissions p ON rp.permission_id = p.id
           WHERE rp.role_id = $1`,
          [mem.role_id]
        );
        permissions = permsRes.rows.map((p) => p.key);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isSuperAdmin: user.is_super_admin,
      activeOrganizationId: activeOrgId,
      activeBranchId: activeBranchId,
      roles,
      permissions,
    };
  }
}
