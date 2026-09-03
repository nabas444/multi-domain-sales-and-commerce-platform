import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

export interface ListingModerationFilter {
  domainId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ModerationDecisionDto {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  reasonCode?: string;
  notes?: string;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Returns items in the moderator queue awaiting human inspection
   */
  async getListingModerationQueue(filters: ListingModerationFilter = {}) {
    let sql = `
      SELECT l.*, o.name as organization_name, o.slug as organization_slug,
             d.name as domain_name, c.name as category_name,
             u.first_name || ' ' || u.last_name as submitter_name, u.email as submitter_email
      FROM inventory.listings l
      JOIN organizations.tenants o ON l.organization_id = o.id
      JOIN domains.domains d ON l.domain_id = d.id
      JOIN domains.categories c ON l.category_id = c.id
      LEFT JOIN organizations.memberships tm ON tm.organization_id = l.organization_id AND tm.is_primary = TRUE
      LEFT JOIN identity.users u ON tm.user_id = u.id
      WHERE l.deleted_at IS NULL
    `;
    const params: unknown[] = [];

    if (filters.status) {
      params.push(filters.status);
      sql += ` AND l.moderation_status = $${params.length}`;
    } else {
      sql += ` AND l.moderation_status IN ('PENDING', 'NEEDS_CORRECTION')`;
    }

    if (filters.domainId) {
      params.push(filters.domainId);
      sql += ` AND l.domain_id = $${params.length}`;
    }

    sql += ' ORDER BY l.created_at ASC';

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

  /**
   * Executes a formal moderation action on a listing
   */
  async reviewListing(listingId: string, decision: ModerationDecisionDto, moderatorId: string) {
    const listingRes = await dbPool.query<{
      id: string;
      organization_id: string;
      status: string;
      moderation_status: string;
    }>(
      'SELECT id, organization_id, status, moderation_status FROM inventory.listings WHERE id = $1',
      [listingId]
    );

    if (listingRes.rows.length === 0) {
      throw new NotFoundException('Listing not found');
    }

    const listing = listingRes.rows[0];

    let targetListingStatus = listing.status;
    let targetModerationStatus = listing.moderation_status;
    let publishedAt: string | null = null;

    if (decision.action === 'APPROVE') {
      targetModerationStatus = 'APPROVED';
      targetListingStatus = 'PUBLISHED';
      publishedAt = new Date().toISOString();
    } else if (decision.action === 'REJECT') {
      targetModerationStatus = 'REJECTED';
      targetListingStatus = 'ARCHIVED';
    } else if (decision.action === 'REQUEST_CHANGES') {
      targetModerationStatus = 'NEEDS_CORRECTION';
      targetListingStatus = 'DRAFT';
    }

    const res = await dbPool.query(
      `UPDATE inventory.listings
       SET moderation_status = $1,
           status = $2,
           moderation_notes = $3,
           published_at = COALESCE($4, published_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        targetModerationStatus,
        targetListingStatus,
        decision.notes || null,
        publishedAt,
        listingId,
      ]
    );

    await this.auditService.log({
      actorId: moderatorId,
      organizationId: listing.organization_id,
      resource: 'listing',
      resourceId: listingId,
      action: `moderation.listing_${decision.action.toLowerCase()}`,
      stateDiff: {
        previous: { status: listing.status, moderation: listing.moderation_status },
        next: { status: targetListingStatus, moderation: targetModerationStatus },
        reasonCode: decision.reasonCode,
        notes: decision.notes,
      },
    });

    return res.rows[0];
  }

  /**
   * Returns organizations awaiting partner KYC verification
   */
  async getPartnerVerificationQueue() {
    const res = await dbPool.query(
      `SELECT t.*,
              COUNT(d.id)::int as document_count,
              COUNT(CASE WHEN d.is_verified THEN 1 END)::int as verified_doc_count
       FROM organizations.tenants t
       LEFT JOIN media.documents d ON d.organization_id = t.id
       WHERE t.status IN ('PENDING_VERIFICATION', 'DRAFT', 'NEEDS_CORRECTION')
       GROUP BY t.id
       ORDER BY t.created_at ASC`
    );
    return res.rows;
  }

  /**
   * Executes partner KYC verification approval or rejection
   */
  async reviewPartnerVerification(
    organizationId: string,
    decision: { status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED'; notes?: string },
    moderatorId: string
  ) {
    const targetStatus = decision.status === 'VERIFIED' ? 'APPROVED' : (decision.status === 'REJECTED' ? 'NEEDS_CORRECTION' : 'SUSPENDED');
    const verifiedAt = targetStatus === 'APPROVED' ? new Date().toISOString() : null;
    const res = await dbPool.query(
      `UPDATE organizations.tenants
       SET status = $1,
           verified_at = COALESCE($2, verified_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [targetStatus, verifiedAt, organizationId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Partner organization not found');
    }

    await this.auditService.log({
      actorId: moderatorId,
      organizationId,
      resource: 'organization',
      resourceId: organizationId,
      action: `moderation.partner_${decision.status.toLowerCase()}`,
      metadata: { notes: decision.notes },
    });

    return res.rows[0];
  }

  /**
   * Verifies compliance document (Title Deed, Trade License, Commercial Registration)
   */
  async reviewDocumentVerification(
    documentId: string,
    isVerified: boolean,
    moderatorId: string,
    notes?: string
  ) {
    const res = await dbPool.query(
      `UPDATE media.documents
       SET is_verified = $1,
           verified_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END,
           verified_by = CASE WHEN $1 THEN $2::uuid ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [isVerified, moderatorId, documentId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Compliance document not found');
    }

    const doc = res.rows[0];

    await this.auditService.log({
      actorId: moderatorId,
      organizationId: doc.organization_id,
      resource: 'document',
      resourceId: documentId,
      action: isVerified ? 'moderation.document_verified' : 'moderation.document_rejected',
      metadata: { documentType: doc.document_type, title: doc.title, notes },
    });

    return doc;
  }
}
