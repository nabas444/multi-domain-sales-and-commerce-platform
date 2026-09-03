import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

export interface ListingFilter {
  domainId?: string;
  categoryId?: string;
  organizationId?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly auditService: AuditService) {}

  // 1. Listings Queries
  async listListings(filters: ListingFilter = {}) {
    let sql = `
      SELECT l.*, o.name as organization_name, o.slug as organization_slug,
             d.name as domain_name, d.slug as domain_slug,
             c.name as category_name, c.slug as category_slug
      FROM inventory.listings l
      JOIN organizations.tenants o ON l.organization_id = o.id
      JOIN domains.domains d ON l.domain_id = d.id
      JOIN domains.categories c ON l.category_id = c.id
      WHERE l.deleted_at IS NULL
    `;
    const params: unknown[] = [];

    if (filters.domainId) {
      params.push(filters.domainId);
      sql += ` AND l.domain_id = $${params.length}`;
    }
    if (filters.categoryId) {
      params.push(filters.categoryId);
      sql += ` AND l.category_id = $${params.length}`;
    }
    if (filters.organizationId) {
      params.push(filters.organizationId);
      sql += ` AND l.organization_id = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status);
      sql += ` AND l.status = $${params.length}`;
    }
    if (filters.priceMin !== undefined) {
      params.push(filters.priceMin);
      sql += ` AND l.price >= $${params.length}`;
    }
    if (filters.priceMax !== undefined) {
      params.push(filters.priceMax);
      sql += ` AND l.price <= $${params.length}`;
    }
    if (filters.isFeatured !== undefined) {
      params.push(filters.isFeatured);
      sql += ` AND l.is_featured = $${params.length}`;
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`;
    }

    sql += ' ORDER BY l.is_featured DESC, l.created_at DESC';

    const limit = filters.limit || 50;
    params.push(limit);
    sql += ` LIMIT $${params.length}`;

    if (filters.offset) {
      params.push(filters.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getListingByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const sql = `
      SELECT l.*, o.name as organization_name, o.slug as organization_slug, o.type as organization_type,
             d.name as domain_name, d.slug as domain_slug,
             c.name as category_name, c.slug as category_slug
      FROM inventory.listings l
      JOIN organizations.tenants o ON l.organization_id = o.id
      JOIN domains.domains d ON l.domain_id = d.id
      JOIN domains.categories c ON l.category_id = c.id
      WHERE (l.id = $1 OR l.slug = $1) AND l.deleted_at IS NULL
    `;
    const res = await dbPool.query(sql, [idOrSlug]);
    if (res.rows.length === 0) {
      throw new NotFoundException(`Listing not found: ${idOrSlug}`);
    }

    const listing = res.rows[0];

    // Fetch ownership authorization
    const ownershipRes = await dbPool.query(
      'SELECT * FROM inventory.ownership_authorizations WHERE listing_id = $1',
      [listing.id]
    );
    listing.ownership = ownershipRes.rows[0] || null;

    // Increment view count asynchronously
    dbPool.query('UPDATE inventory.listings SET view_count = view_count + 1 WHERE id = $1', [listing.id]).catch(() => {});

    return listing;
  }

  // 2. Listing Mutations
  async createListing(
    organizationId: string,
    data: {
      domainId: string;
      categoryId: string;
      branchId?: string | null;
      title: string;
      slug: string;
      description?: string;
      inventoryModel?: string;
      price: number;
      currency?: string;
      priceType?: string;
      stockQuantity?: number;
      attributes?: Record<string, unknown>;
      primaryMediaUrl?: string;
      location?: Record<string, unknown>;
      ownerInfo?: {
        ownerName: string;
        ownerContact: string;
        salesRightType: string;
        authorizationStartDate: string;
      };
    },
    actorId: string
  ) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const listingRes = await client.query<{ id: string }>(
        `INSERT INTO inventory.listings (
           organization_id, domain_id, category_id, branch_id, title, slug, description,
           inventory_model, price, currency, price_type, stock_quantity, attributes,
           primary_media_url, location, status, moderation_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'DRAFT', 'PENDING')
         RETURNING *`,
        [
          organizationId,
          data.domainId,
          data.categoryId,
          data.branchId || null,
          data.title,
          data.slug.toLowerCase(),
          data.description || null,
          data.inventoryModel || 'UNIQUE_ITEM',
          data.price,
          data.currency || 'ETB',
          data.priceType || 'FIXED',
          data.stockQuantity !== undefined ? data.stockQuantity : 1,
          JSON.stringify(data.attributes || {}),
          data.primaryMediaUrl || null,
          JSON.stringify(data.location || {}),
        ]
      );
      const createdListing = listingRes.rows[0];

      // Insert Ownership Authorization if provided
      if (data.ownerInfo) {
        await client.query(
          `INSERT INTO inventory.ownership_authorizations (
             listing_id, organization_id, owner_name, owner_contact, sales_right_type,
             authorization_start_date, verification_status
           ) VALUES ($1, $2, $3, $4, $5, $6, 'VERIFIED')`,
          [
            createdListing.id,
            organizationId,
            data.ownerInfo.ownerName,
            data.ownerInfo.ownerContact,
            data.ownerInfo.salesRightType || 'EXCLUSIVE',
            data.ownerInfo.authorizationStartDate || new Date().toISOString().split('T')[0],
          ]
        );
      }

      await client.query('COMMIT');

      await this.auditService.log({
        actorId,
        organizationId,
        resource: 'listing',
        resourceId: createdListing.id,
        action: 'listing.created',
      });

      return createdListing;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 3. Status Transition Workflow: DRAFT -> PENDING_REVIEW -> APPROVED -> PUBLISHED
  async transitionStatus(
    listingId: string,
    targetStatus: string,
    organizationId: string,
    isSuperAdmin: boolean,
    actorId: string,
    notes?: string
  ) {
    const listingRes = await dbPool.query<{ id: string; organization_id: string; status: string }>(
      'SELECT id, organization_id, status FROM inventory.listings WHERE id = $1',
      [listingId]
    );
    if (listingRes.rows.length === 0) {
      throw new NotFoundException('Listing not found');
    }

    const listing = listingRes.rows[0];
    if (!isSuperAdmin && listing.organization_id !== organizationId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    let moderationStatus = 'PENDING';
    let publishedAt: string | null = null;

    if (targetStatus === 'APPROVED' || targetStatus === 'PUBLISHED') {
      if (!isSuperAdmin) {
        throw new ForbiddenException('Only system moderators / super admins can approve and publish listings');
      }
      moderationStatus = 'APPROVED';
      publishedAt = new Date().toISOString();
    } else if (targetStatus === 'REJECTED') {
      if (!isSuperAdmin) {
        throw new ForbiddenException('Only system moderators can reject listings');
      }
      moderationStatus = 'REJECTED';
    }

    const updated = await dbPool.query(
      `UPDATE inventory.listings
       SET status = $1, moderation_status = $2, moderation_notes = $3,
           published_at = COALESCE($4::timestamptz, published_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [targetStatus, moderationStatus, notes || null, publishedAt, listingId]
    );

    await this.auditService.log({
      actorId,
      organizationId: listing.organization_id,
      resource: 'listing',
      resourceId: listingId,
      action: `listing.status_${targetStatus.toLowerCase()}`,
      stateDiff: { previous: listing.status, next: targetStatus, notes },
    });

    return updated.rows[0];
  }

  // 4. Media & Document Management
  async uploadMedia(
    organizationId: string,
    fileData: {
      fileName: string;
      fileUrl: string;
      mimeType: string;
      fileSizeBytes: number;
      mediaType: string;
      role?: string;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO media.media_assets (
         organization_id, file_name, file_url, mime_type, file_size_bytes, media_type, role, uploaded_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        organizationId,
        fileData.fileName,
        fileData.fileUrl,
        fileData.mimeType,
        fileData.fileSizeBytes,
        fileData.mediaType,
        fileData.role || 'GALLERY',
        actorId,
      ]
    );
    return res.rows[0];
  }

  async linkMedia(mediaId: string, entityType: string, entityId: string, sortOrder = 0) {
    const res = await dbPool.query(
      `INSERT INTO media.media_links (media_id, entity_type, entity_id, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (media_id, entity_type, entity_id) DO UPDATE SET sort_order = $4
       RETURNING *`,
      [mediaId, entityType, entityId, sortOrder]
    );
    return res.rows[0];
  }

  async getEntityMedia(entityType: string, entityId: string) {
    const res = await dbPool.query(
      `SELECT m.*, ml.sort_order
       FROM media.media_assets m
       JOIN media.media_links ml ON m.id = ml.media_id
       WHERE ml.entity_type = $1 AND ml.entity_id = $2
       ORDER BY ml.sort_order ASC, m.created_at ASC`,
      [entityType, entityId]
    );
    return res.rows;
  }
}
