import { Injectable, NotFoundException } from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class WorkflowsService {
  constructor(private readonly auditService: AuditService) {}

  // 1. Business Workflows
  async listWorkflows(domainId?: string, organizationId?: string) {
    let sql = 'SELECT * FROM platform.workflows WHERE is_active = TRUE';
    const params: unknown[] = [];
    if (domainId) {
      params.push(domainId);
      sql += ` AND domain_id = $${params.length}`;
    }
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    sql += ' ORDER BY created_at DESC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async createWorkflow(
    data: {
      domainId?: string;
      organizationId?: string;
      name: string;
      triggerEvent: string;
      conditions: any[];
      actions: any[];
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO platform.workflows (
         domain_id, organization_id, name, trigger_event, conditions, actions, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [
        data.domainId || null,
        data.organizationId || null,
        data.name,
        data.triggerEvent,
        JSON.stringify(data.conditions || []),
        JSON.stringify(data.actions || []),
      ]
    );

    await this.auditService.log({
      actorId,
      resource: 'workflow',
      resourceId: res.rows[0].id,
      action: 'workflow.created',
    });

    return res.rows[0];
  }

  // 2. Dynamic Forms
  async listForms(domainId?: string) {
    let sql = 'SELECT * FROM platform.form_definitions WHERE is_active = TRUE';
    const params: unknown[] = [];
    if (domainId) {
      params.push(domainId);
      sql += ` AND domain_id = $${params.length}`;
    }
    sql += ' ORDER BY title ASC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getFormByCode(code: string) {
    const res = await dbPool.query(
      'SELECT * FROM platform.form_definitions WHERE code = $1 AND is_active = TRUE',
      [code]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException(`Form definition not found: ${code}`);
    }
    return res.rows[0];
  }

  async createForm(
    data: {
      domainId?: string;
      code: string;
      title: string;
      description?: string;
      fields: any[];
      validationRules?: Record<string, unknown>;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO platform.form_definitions (
         domain_id, code, title, description, fields, validation_rules, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (code) DO UPDATE SET
         title = $3, description = $4, fields = $5, validation_rules = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        data.domainId || null,
        data.code,
        data.title,
        data.description || null,
        JSON.stringify(data.fields || []),
        JSON.stringify(data.validationRules || {}),
      ]
    );

    await this.auditService.log({
      actorId,
      resource: 'form_definition',
      resourceId: res.rows[0].id,
      action: 'form.saved',
    });

    return res.rows[0];
  }

  // 3. In-App Notifications Center
  async listNotifications(userId: string, unreadOnly = false) {
    let sql = 'SELECT * FROM notifications.notifications WHERE user_id = $1';
    const params: unknown[] = [userId];
    if (unreadOnly) {
      sql += ' AND is_read = FALSE';
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const res = await dbPool.query(
      'UPDATE notifications.notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return res.rows[0] || null;
  }

  async sendNotification(
    userId: string,
    organizationId: string,
    title: string,
    message: string,
    channel = 'IN_APP',
    linkUrl?: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO notifications.notifications (
         user_id, organization_id, title, message, channel, link_url, is_read
       ) VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [userId, organizationId, title, message, channel, linkUrl || null]
    );
    return res.rows[0];
  }
}
