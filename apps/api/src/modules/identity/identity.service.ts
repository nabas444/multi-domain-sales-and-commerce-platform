import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { dbPool } from '@platform/database';
import { env } from '@platform/config';
import { LoginInput, RegisterUserInput } from '@platform/validation';
import { AuthSession, UserContext } from '@platform/types';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class IdentityService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  async register(
    input: RegisterUserInput,
    meta?: { ip?: string; userAgent?: string; correlationId?: string }
  ): Promise<AuthSession> {
    const existing = await dbPool.query(
      'SELECT id FROM identity.users WHERE email = $1',
      [input.email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('A user with this email address already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const result = await dbPool.query<{ id: string }>(
      `INSERT INTO identity.users (email, password_hash, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        input.email.toLowerCase(),
        passwordHash,
        input.firstName,
        input.lastName,
        input.phone || null,
      ]
    );

    const userId = result.rows[0].id;

    await this.auditService.log({
      actorId: userId,
      actorEmail: input.email.toLowerCase(),
      resource: 'identity.user',
      resourceId: userId,
      action: 'user.registered',
      correlationId: meta?.correlationId,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return this.generateSession(
      {
        id: userId,
        email: input.email.toLowerCase(),
        firstName: input.firstName,
        lastName: input.lastName,
        isSuperAdmin: false,
        activeOrganizationId: null,
        activeBranchId: null,
        roles: [],
        permissions: [],
      },
      meta
    );
  }

  async login(
    input: LoginInput,
    meta?: { ip?: string; userAgent?: string; correlationId?: string }
  ): Promise<AuthSession> {
    const userRes = await dbPool.query<{
      id: string;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
      is_super_admin: boolean;
      is_active: boolean;
    }>(
      `SELECT id, email, password_hash, first_name, last_name, is_super_admin, is_active
       FROM identity.users
       WHERE email = $1 AND deleted_at IS NULL`,
      [input.email.toLowerCase()]
    );

    const user = userRes.rows[0];
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Resolve target organization if specified, or pick primary
    let activeOrgId: string | null = null;
    let activeBranchId: string | null = null;
    let roles: any[] = [];
    let permissions: string[] = [];

    if (user.is_super_admin) {
      roles = ['SUPER_ADMIN'];
      const permsRes = await dbPool.query<{ key: string }>('SELECT key FROM identity.permissions');
      permissions = permsRes.rows.map((p) => p.key);

      if (input.organizationSlug) {
        const orgRes = await dbPool.query<{ id: string }>(
          'SELECT id FROM organizations.tenants WHERE slug = $1 AND deleted_at IS NULL',
          [input.organizationSlug]
        );
        if (orgRes.rows.length > 0) {
          activeOrgId = orgRes.rows[0].id;
        }
      }
    } else {
      let queryStr = `
        SELECT m.organization_id, m.branch_id, r.code as role_code, r.id as role_id, o.status as org_status
        FROM organizations.memberships m
        JOIN organizations.tenants o ON m.organization_id = o.id
        JOIN identity.roles r ON m.role_id = r.id
        WHERE m.user_id = $1 AND m.is_active = TRUE AND m.deleted_at IS NULL AND o.deleted_at IS NULL
      `;
      const queryParams: unknown[] = [user.id];

      if (input.organizationSlug) {
        queryStr += ' AND o.slug = $2';
        queryParams.push(input.organizationSlug);
      } else {
        queryStr += ' ORDER BY m.is_primary DESC LIMIT 1';
      }

      const membershipRes = await dbPool.query<{
        organization_id: string;
        branch_id: string | null;
        role_code: string;
        role_id: string;
        org_status: string;
      }>(queryStr, queryParams);

      if (membershipRes.rows.length > 0) {
        const mem = membershipRes.rows[0];
        if (mem.org_status === 'SUSPENDED' || mem.org_status === 'TERMINATED') {
          throw new UnauthorizedException(`Partner organization is ${mem.org_status.toLowerCase()}`);
        }

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

    // Update last login timestamp
    await dbPool.query(
      'UPDATE identity.users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const userCtx: UserContext = {
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

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      organizationId: activeOrgId,
      resource: 'identity.session',
      action: 'user.logged_in',
      correlationId: meta?.correlationId,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return this.generateSession(userCtx, meta);
  }

  private async generateSession(
    user: UserContext,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<AuthSession> {
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.activeOrganizationId,
      branchId: user.activeBranchId,
      isSuperAdmin: user.isSuperAdmin,
    };

    const token = this.jwtService.sign(payload, {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save session in database for revocation tracking
    await dbPool.query(
      `INSERT INTO identity.sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        bcrypt.hashSync(token.slice(-32), 6),
        meta?.ip || null,
        meta?.userAgent || null,
        expiresAt,
      ]
    );

    return {
      token,
      user,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
