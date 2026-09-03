import { Injectable, Logger } from '@nestjs/common';
import { dbPool } from '@platform/database';

export interface RecordAuditParams {
  actorId?: string | null;
  actorEmail?: string | null;
  organizationId?: string | null;
  resource: string;
  resourceId?: string | null;
  action: string;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  stateDiff?: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    [key: string]: unknown;
  } | Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(params: RecordAuditParams): Promise<void> {
    try {
      await dbPool.query(
        `INSERT INTO audit.audit_logs (
           actor_id, actor_email, organization_id, resource, resource_id,
           action, correlation_id, ip_address, user_agent, state_diff, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          params.actorId || null,
          params.actorEmail || null,
          params.organizationId || null,
          params.resource,
          params.resourceId || null,
          params.action,
          params.correlationId || null,
          params.ipAddress || null,
          params.userAgent || null,
          params.stateDiff ? JSON.stringify(params.stateDiff) : null,
          JSON.stringify(params.metadata || {}),
        ]
      );
    } catch (err) {
      // Audit log failures must be logged as high-severity alerts
      this.logger.error('CRITICAL: Failed to write immutable audit log entry', {
        err,
        params,
      });
    }
  }

  async queryLogs(filter: {
    organizationId?: string | null;
    resource?: string;
    actorId?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filter.organizationId) {
      conditions.push(`organization_id = $${idx++}`);
      params.push(filter.organizationId);
    }

    if (filter.resource) {
      conditions.push(`resource = $${idx++}`);
      params.push(filter.resource);
    }

    if (filter.actorId) {
      conditions.push(`actor_id = $${idx++}`);
      params.push(filter.actorId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    const countRes = await dbPool.query<{ count: string }>(
      `SELECT count(*) as count FROM audit.audit_logs ${whereClause}`,
      params
    );

    const itemsRes = await dbPool.query(
      `SELECT id, actor_id, actor_email, organization_id, resource, resource_id,
              action, correlation_id, ip_address, user_agent, state_diff, metadata, created_at
       FROM audit.audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    return {
      items: itemsRes.rows,
      total: parseInt(countRes.rows[0]?.count || '0', 10),
      limit,
      offset,
    };
  }
}
