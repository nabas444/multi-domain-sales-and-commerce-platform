import { Injectable, NotFoundException } from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class MarketingService {
  constructor(private readonly auditService: AuditService) {}

  // 1. Marketing Campaigns
  async listCampaigns(organizationId: string) {
    const res = await dbPool.query(
      `SELECT c.*, d.name as domain_name
       FROM marketing.campaigns c
       LEFT JOIN domains.domains d ON c.domain_id = d.id
       WHERE c.organization_id = $1
       ORDER BY c.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async createCampaign(
    organizationId: string,
    data: {
      domainId?: string | null;
      name: string;
      slug: string;
      objective: string;
      budget: number;
      currency?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      startDate?: string;
      endDate?: string;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO marketing.campaigns (
         organization_id, domain_id, name, slug, objective, budget, currency,
         utm_source, utm_medium, utm_campaign, start_date, end_date, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE')
       RETURNING *`,
      [
        organizationId,
        data.domainId || null,
        data.name,
        data.slug.toLowerCase(),
        data.objective || 'LEAD_GENERATION',
        data.budget,
        data.currency || 'ETB',
        data.utmSource || null,
        data.utmMedium || null,
        data.utmCampaign || null,
        data.startDate || null,
        data.endDate || null,
      ]
    );

    await this.auditService.log({
      actorId,
      organizationId,
      resource: 'campaign',
      resourceId: res.rows[0].id,
      action: 'campaign.created',
    });

    return res.rows[0];
  }

  // 2. CMS Landing Pages & Articles
  async listLandingPages(domainId?: string) {
    let sql = 'SELECT * FROM content.landing_pages WHERE 1=1';
    const params: unknown[] = [];
    if (domainId) {
      params.push(domainId);
      sql += ` AND domain_id = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getLandingPageBySlug(slug: string) {
    const res = await dbPool.query(
      'SELECT * FROM content.landing_pages WHERE slug = $1 AND is_published = TRUE',
      [slug]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(`Landing page not found: ${slug}`);
    }
    return res.rows[0];
  }

  async saveLandingPage(
    data: {
      domainId?: string;
      title: string;
      slug: string;
      heroHeadline?: string;
      heroSubheadline?: string;
      contentBlocks: any[];
      seoTitle?: string;
      seoDescription?: string;
      isPublished?: boolean;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO content.landing_pages (
         domain_id, title, slug, hero_headline, hero_subheadline, content_blocks,
         seo_title, seo_description, is_published, published_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9 = TRUE THEN CURRENT_TIMESTAMP ELSE NULL END)
       ON CONFLICT (slug) DO UPDATE SET
         title = $2, hero_headline = $4, hero_subheadline = $5, content_blocks = $6,
         seo_title = $7, seo_description = $8, is_published = $9, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        data.domainId || null,
        data.title,
        data.slug.toLowerCase(),
        data.heroHeadline || null,
        data.heroSubheadline || null,
        JSON.stringify(data.contentBlocks || []),
        data.seoTitle || null,
        data.seoDescription || null,
        data.isPublished || false,
      ]
    );

    await this.auditService.log({
      actorId,
      resource: 'landing_page',
      resourceId: res.rows[0].id,
      action: 'landing_page.saved',
    });

    return res.rows[0];
  }

  // 3. Webhooks
  async listWebhooks(organizationId: string) {
    const res = await dbPool.query(
      'SELECT * FROM platform.webhooks WHERE organization_id = $1 ORDER BY created_at DESC',
      [organizationId]
    );
    return res.rows;
  }

  async createWebhook(
    organizationId: string,
    data: { url: string; secret: string; eventTypes: string[] },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO platform.webhooks (organization_id, url, secret, event_types, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [organizationId, data.url, data.secret, JSON.stringify(data.eventTypes)]
    );

    await this.auditService.log({
      actorId,
      organizationId,
      resource: 'webhook',
      resourceId: res.rows[0].id,
      action: 'webhook.created',
    });

    return res.rows[0];
  }

  // 4. Bulk Imports
  async listImportJobs(organizationId: string) {
    const res = await dbPool.query(
      'SELECT * FROM platform.import_jobs WHERE organization_id = $1 ORDER BY created_at DESC',
      [organizationId]
    );
    return res.rows;
  }

  async createImportJob(
    organizationId: string,
    data: {
      domainId?: string;
      entityType: string;
      fileName: string;
      totalRows: number;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO platform.import_jobs (
         organization_id, domain_id, entity_type, file_name, total_rows, status, created_by
       ) VALUES ($1, $2, $3, $4, $5, 'PROCESSING', $6)
       RETURNING *`,
      [
        organizationId,
        data.domainId || null,
        data.entityType,
        data.fileName,
        data.totalRows,
        actorId,
      ]
    );
    return res.rows[0];
  }
}
