import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class DomainsService {
  constructor(private readonly auditService: AuditService) {}

  // 1. Domains
  async listDomains(status?: string) {
    let sql = 'SELECT * FROM domains.domains WHERE 1=1';
    const params: unknown[] = [];
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ' ORDER BY sort_order ASC, name ASC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getDomain(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const sql = isUuid
      ? 'SELECT * FROM domains.domains WHERE id = $1'
      : 'SELECT * FROM domains.domains WHERE slug = $1';
    const res = await dbPool.query(sql, [idOrSlug]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Domain not found: ${idOrSlug}`);
    }
    return res.rows[0];
  }

  async createDomain(
    data: {
      name: string;
      slug: string;
      code: string;
      icon?: string;
      description?: string;
      status?: string;
      defaultCurrency?: string;
      measurementSystem?: string;
      timezone?: string;
      enabledModules?: string[];
      sortOrder?: number;
    },
    actorId: string
  ) {
    const existing = await dbPool.query(
      'SELECT id FROM domains.domains WHERE slug = $1 OR code = $2',
      [data.slug.toLowerCase(), data.code.toUpperCase()]
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('A domain with this slug or code already exists');
    }

    const res = await dbPool.query(
      `INSERT INTO domains.domains (
         name, slug, code, icon, description, status, default_currency,
         measurement_system, timezone, enabled_modules, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.name,
        data.slug.toLowerCase(),
        data.code.toUpperCase(),
        data.icon || null,
        data.description || null,
        data.status || 'DRAFT',
        data.defaultCurrency || 'ETB',
        data.measurementSystem || 'METRIC',
        data.timezone || 'Africa/Addis_Ababa',
        JSON.stringify(data.enabledModules || ['INVENTORY', 'CRM', 'SALES', 'MARKETING', 'FINANCE']),
        data.sortOrder || 0,
      ]
    );

    const created = res.rows[0];
    await this.auditService.log({
      actorId,
      resource: 'domain',
      resourceId: created.id,
      action: 'domain.created',
      stateDiff: { domain: created },
    });

    return created;
  }

  // 2. Categories Tree
  async listCategories(domainId: string, parentId?: string | null) {
    let sql = 'SELECT * FROM domains.categories WHERE domain_id = $1';
    const params: unknown[] = [domainId];

    if (parentId !== undefined) {
      if (parentId === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        params.push(parentId);
        sql += ` AND parent_id = $${params.length}`;
      }
    }

    sql += ' ORDER BY sort_order ASC, name ASC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getCategoryTree(domainId: string) {
    const res = await dbPool.query(
      'SELECT * FROM domains.categories WHERE domain_id = $1 ORDER BY sort_order ASC, name ASC',
      [domainId]
    );
    const allCategories = res.rows;

    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const c of allCategories) {
      map.set(c.id, { ...c, children: [] });
    }

    for (const c of allCategories) {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(map.get(c.id));
      } else {
        roots.push(map.get(c.id));
      }
    }

    return roots;
  }

  async createCategory(
    data: {
      domainId: string;
      parentId?: string | null;
      name: string;
      slug: string;
      code: string;
      icon?: string;
      description?: string;
      sortOrder?: number;
    },
    actorId: string
  ) {
    const existing = await dbPool.query(
      'SELECT id FROM domains.categories WHERE domain_id = $1 AND slug = $2',
      [data.domainId, data.slug.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      throw new ConflictException('A category with this slug already exists in this domain');
    }

    const res = await dbPool.query(
      `INSERT INTO domains.categories (
         domain_id, parent_id, name, slug, code, icon, description, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.domainId,
        data.parentId || null,
        data.name,
        data.slug.toLowerCase(),
        data.code.toUpperCase(),
        data.icon || null,
        data.description || null,
        data.sortOrder || 0,
      ]
    );

    const created = res.rows[0];
    await this.auditService.log({
      actorId,
      resource: 'category',
      resourceId: created.id,
      action: 'category.created',
      stateDiff: { category: created },
    });

    return created;
  }

  // 3. Dynamic Attribute Definitions
  async listAttributes(domainId: string, categoryId?: string) {
    if (categoryId) {
      const res = await dbPool.query(
        `SELECT a.*, ca.is_required as category_required, ca.sort_order as category_sort_order
         FROM domains.attribute_definitions a
         JOIN domains.category_attributes ca ON a.id = ca.attribute_id
         WHERE ca.category_id = $1
         ORDER BY ca.sort_order ASC, a.name ASC`,
        [categoryId]
      );
      return res.rows;
    }

    const res = await dbPool.query(
      'SELECT * FROM domains.attribute_definitions WHERE domain_id = $1 ORDER BY group_name ASC, sort_order ASC, name ASC',
      [domainId]
    );
    return res.rows;
  }

  async createAttribute(
    data: {
      domainId: string;
      name: string;
      slug: string;
      code: string;
      groupName?: string;
      type: string;
      isRequired?: boolean;
      isSearchable?: boolean;
      isFilterable?: boolean;
      isSortable?: boolean;
      validationRules?: Record<string, unknown>;
      sortOrder?: number;
      categoryIds?: string[];
    },
    actorId: string
  ) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const res = await client.query<{ id: string }>(
        `INSERT INTO domains.attribute_definitions (
           domain_id, name, slug, code, group_name, type, is_required,
           is_searchable, is_filterable, is_sortable, validation_rules, sort_order
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          data.domainId,
          data.name,
          data.slug.toLowerCase(),
          data.code.toUpperCase(),
          data.groupName || 'General',
          data.type,
          data.isRequired || false,
          data.isSearchable !== false,
          data.isFilterable !== false,
          data.isSortable || false,
          JSON.stringify(data.validationRules || {}),
          data.sortOrder || 0,
        ]
      );
      const created = res.rows[0];

      if (data.categoryIds && data.categoryIds.length > 0) {
        for (const catId of data.categoryIds) {
          await client.query(
            `INSERT INTO domains.category_attributes (category_id, attribute_id, is_required)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [catId, created.id, data.isRequired || false]
          );
        }
      }

      await client.query('COMMIT');

      await this.auditService.log({
        actorId,
        resource: 'attribute',
        resourceId: created.id,
        action: 'attribute.created',
      });

      return created;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 4. Category UI Template
  async getCategoryTemplate(categoryId: string) {
    const res = await dbPool.query(
      'SELECT * FROM domains.category_templates WHERE category_id = $1',
      [categoryId]
    );
    return res.rows[0] || null;
  }

  async saveCategoryTemplate(
    categoryId: string,
    data: {
      name: string;
      cardFields: string[];
      detailSections: any[];
      searchFilters: any[];
    }
  ) {
    const res = await dbPool.query(
      `INSERT INTO domains.category_templates (
         category_id, name, card_fields, detail_sections, search_filters
       ) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (category_id) DO UPDATE SET
         name = $2, card_fields = $3, detail_sections = $4, search_filters = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        categoryId,
        data.name,
        JSON.stringify(data.cardFields),
        JSON.stringify(data.detailSections),
        JSON.stringify(data.searchFilters),
      ]
    );
    return res.rows[0];
  }

  // 5. Partner Domain Publishing Permissions
  async getTenantDomains(organizationId: string) {
    const res = await dbPool.query(
      `SELECT td.*, d.name as domain_name, d.slug as domain_slug, d.icon as domain_icon
       FROM organizations.tenant_domains td
       JOIN domains.domains d ON td.domain_id = d.id
       WHERE td.organization_id = $1 AND td.is_enabled = TRUE`,
      [organizationId]
    );
    return res.rows;
  }

  async setTenantDomainPermission(
    organizationId: string,
    domainId: string,
    allowedCategories: string[] = ['*'],
    isEnabled = true
  ) {
    const res = await dbPool.query(
      `INSERT INTO organizations.tenant_domains (
         organization_id, domain_id, allowed_categories, is_enabled
       ) VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, domain_id) DO UPDATE SET
         allowed_categories = $3, is_enabled = $4
       RETURNING *`,
      [organizationId, domainId, JSON.stringify(allowedCategories), isEnabled]
    );
    return res.rows[0];
  }
}
