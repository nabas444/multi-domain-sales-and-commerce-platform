import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import {
  CreateOrganizationInput,
  CreateBranchInput,
  AddMemberInput,
} from '@platform/validation';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly auditService: AuditService) {}

  async createOrganization(
    input: CreateOrganizationInput,
    creatorUserId: string,
    isSuperAdmin: boolean,
    meta?: { ip?: string; userAgent?: string; correlationId?: string }
  ) {
    const existing = await dbPool.query(
      'SELECT id FROM organizations.tenants WHERE slug = $1',
      [input.slug.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('An organization with this slug already exists');
    }

    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const initialStatus = isSuperAdmin ? 'ACTIVE' : 'DRAFT';

      // 1. Insert tenant
      const orgRes = await client.query<{ id: string }>(
        `INSERT INTO organizations.tenants (
           name, slug, type, status, legal_name, tax_identification_number,
           primary_contact_email, primary_contact_phone, website_url,
           country_code, city, address
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          input.name,
          input.slug.toLowerCase(),
          input.type,
          initialStatus,
          input.legalName || null,
          input.taxIdentificationNumber || null,
          input.primaryContactEmail,
          input.primaryContactPhone || null,
          input.websiteUrl || null,
          input.countryCode || 'ET',
          input.city || null,
          input.address || null,
        ]
      );
      const organizationId = orgRes.rows[0].id;

      // 2. Create default main branch
      const branchRes = await client.query<{ id: string }>(
        `INSERT INTO organizations.branches (
           organization_id, name, code, city, address, is_main_branch
         ) VALUES ($1, $2, 'MAIN', $3, $4, TRUE)
         RETURNING id`,
        [
          organizationId,
          `${input.name} - Headquarters`,
          input.city || 'Addis Ababa',
          input.address || null,
        ]
      );
      const branchId = branchRes.rows[0].id;

      // 3. Find Tenant Admin Role ID
      const roleRes = await client.query<{ id: string }>(
        "SELECT id FROM identity.roles WHERE code = 'TENANT_ADMIN' AND organization_id IS NULL"
      );
      const tenantAdminRoleId = roleRes.rows[0]?.id;

      // 4. Assign creator membership
      await client.query(
        `INSERT INTO organizations.memberships (
           user_id, organization_id, branch_id, role_id, is_primary, is_active
         ) VALUES ($1, $2, $3, $4, TRUE, TRUE)`,
        [creatorUserId, organizationId, branchId, tenantAdminRoleId]
      );

      await client.query('COMMIT');

      await this.auditService.log({
        actorId: creatorUserId,
        organizationId,
        resource: 'organization',
        resourceId: organizationId,
        action: 'organization.created',
        correlationId: meta?.correlationId,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { slug: input.slug, type: input.type, status: initialStatus },
      });

      return {
        id: organizationId,
        name: input.name,
        slug: input.slug.toLowerCase(),
        status: initialStatus,
        branchId,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getOrganization(organizationId: string) {
    const res = await dbPool.query(
      `SELECT id, name, slug, type, status, legal_name, tax_identification_number,
              primary_contact_email, primary_contact_phone, website_url, country_code,
              city, address, verified_at, created_at
       FROM organizations.tenants
       WHERE id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Organization not found');
    }

    return res.rows[0];
  }

  async listOrganizations(userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) {
      const res = await dbPool.query(
        `SELECT o.id, o.name, o.slug, o.type, o.status, o.city, o.country_code,
                o.created_at, count(b.id) as branch_count
         FROM organizations.tenants o
         LEFT JOIN organizations.branches b ON b.organization_id = o.id AND b.deleted_at IS NULL
         WHERE o.deleted_at IS NULL
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      );
      return res.rows;
    }

    const res = await dbPool.query(
      `SELECT o.id, o.name, o.slug, o.type, o.status, o.city, o.country_code,
              m.is_primary, r.name as role_name, r.code as role_code
       FROM organizations.memberships m
       JOIN organizations.tenants o ON m.organization_id = o.id
       JOIN identity.roles r ON m.role_id = r.id
       WHERE m.user_id = $1 AND m.is_active = TRUE AND m.deleted_at IS NULL AND o.deleted_at IS NULL
       ORDER BY m.is_primary DESC, o.name ASC`,
      [userId]
    );
    return res.rows;
  }

  async createBranch(organizationId: string, input: CreateBranchInput) {
    const res = await dbPool.query<{ id: string }>(
      `INSERT INTO organizations.branches (
         organization_id, name, code, city, address, phone, email, is_main_branch
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, code, city, is_main_branch, created_at`,
      [
        organizationId,
        input.name,
        input.code || null,
        input.city,
        input.address || null,
        input.phone || null,
        input.email || null,
        input.isMainBranch,
      ]
    );

    return res.rows[0];
  }

  async listBranches(organizationId: string) {
    const res = await dbPool.query(
      `SELECT id, name, code, city, address, phone, email, is_main_branch, is_active, created_at
       FROM organizations.branches
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY is_main_branch DESC, name ASC`,
      [organizationId]
    );
    return res.rows;
  }

  async addMember(organizationId: string, input: AddMemberInput) {
    // Find user by email
    const userRes = await dbPool.query<{ id: string; email: string }>(
      'SELECT id, email FROM identity.users WHERE email = $1 AND deleted_at IS NULL',
      [input.email.toLowerCase()]
    );
    if (userRes.rows.length === 0) {
      throw new NotFoundException(`User with email ${input.email} does not exist`);
    }
    const targetUserId = userRes.rows[0].id;

    // Verify role exists
    const roleRes = await dbPool.query(
      'SELECT id, name FROM identity.roles WHERE id = $1',
      [input.roleId]
    );
    if (roleRes.rows.length === 0) {
      throw new BadRequestException('Specified role does not exist');
    }

    // Insert or update membership
    const res = await dbPool.query(
      `INSERT INTO organizations.memberships (
         user_id, organization_id, branch_id, role_id, is_primary, is_active
       ) VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (user_id, organization_id)
       DO UPDATE SET role_id = $4, branch_id = $3, is_active = TRUE
       RETURNING id, user_id, organization_id, branch_id, role_id, is_active, created_at`,
      [
        targetUserId,
        organizationId,
        input.branchId || null,
        input.roleId,
        input.isPrimary,
      ]
    );

    return res.rows[0];
  }

  async listMembers(organizationId: string) {
    const res = await dbPool.query(
      `SELECT m.id as membership_id, u.id as user_id, u.email, u.first_name, u.last_name,
              u.phone, r.name as role_name, r.code as role_code, b.name as branch_name,
              m.is_primary, m.is_active, m.created_at
       FROM organizations.memberships m
       JOIN identity.users u ON m.user_id = u.id
       JOIN identity.roles r ON m.role_id = r.id
       LEFT JOIN organizations.branches b ON m.branch_id = b.id
       WHERE m.organization_id = $1 AND m.deleted_at IS NULL
       ORDER BY m.created_at ASC`,
      [organizationId]
    );
    return res.rows;
  }
}
