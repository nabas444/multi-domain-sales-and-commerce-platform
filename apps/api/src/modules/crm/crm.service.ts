import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class CrmService {
  constructor(private readonly auditService: AuditService) {}

  // 1. Leads
  async listLeads(organizationId: string, filters: {
    domainId?: string;
    assignedAgentId?: string;
    status?: string;
    priority?: string;
  } = {}) {
    let sql = `
      SELECT l.*, c.first_name, c.last_name, c.phone, c.email, c.preferred_contact_method,
             u.first_name as agent_first_name, u.last_name as agent_last_name,
             list.title as listing_title, list.price as listing_price
      FROM crm.leads l
      JOIN crm.customers c ON l.customer_id = c.id
      LEFT JOIN identity.users u ON l.assigned_agent_id = u.id
      LEFT JOIN inventory.listings list ON l.listing_id = list.id
      WHERE l.organization_id = $1
    `;
    const params: unknown[] = [organizationId];

    if (filters.domainId) {
      params.push(filters.domainId);
      sql += ` AND l.domain_id = $${params.length}`;
    }
    if (filters.assignedAgentId) {
      params.push(filters.assignedAgentId);
      sql += ` AND l.assigned_agent_id = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status);
      sql += ` AND l.status = $${params.length}`;
    }
    if (filters.priority) {
      params.push(filters.priority);
      sql += ` AND l.priority = $${params.length}`;
    }

    sql += ' ORDER BY l.created_at DESC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getLeadById(leadId: string, organizationId: string, isSuperAdmin: boolean) {
    const res = await dbPool.query(
      `SELECT l.*, c.first_name, c.last_name, c.phone, c.email, c.preferred_contact_method, c.city as customer_city,
              u.first_name as agent_first_name, u.last_name as agent_last_name, u.email as agent_email,
              list.title as listing_title, list.price as listing_price, list.currency as listing_currency
       FROM crm.leads l
       JOIN crm.customers c ON l.customer_id = c.id
       LEFT JOIN identity.users u ON l.assigned_agent_id = u.id
       LEFT JOIN inventory.listings list ON l.listing_id = list.id
       WHERE l.id = $1`,
      [leadId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Lead not found');
    }

    const lead = res.rows[0];
    if (!isSuperAdmin && lead.organization_id !== organizationId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    // Fetch activities timeline
    const activitiesRes = await dbPool.query(
      `SELECT a.*, u.first_name as actor_first_name, u.last_name as actor_last_name
       FROM crm.lead_activities a
       LEFT JOIN identity.users u ON a.actor_id = u.id
       WHERE a.lead_id = $1
       ORDER BY a.created_at DESC`,
      [leadId]
    );
    lead.activities = activitiesRes.rows;

    return lead;
  }

  async createLead(
    organizationId: string,
    data: {
      domainId: string;
      customer: {
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
        preferredContactMethod?: string;
      };
      listingId?: string | null;
      source?: string;
      priority?: string;
      inquiryMessage?: string;
      requirements?: Record<string, unknown>;
      attributionDetails?: Record<string, unknown>;
    },
    actorId?: string
  ) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // Find or create customer
      let customerId: string;
      const existingCustomer = await client.query<{ id: string }>(
        'SELECT id FROM crm.customers WHERE organization_id = $1 AND phone = $2',
        [organizationId, data.customer.phone]
      );

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
      } else {
        const newCustomer = await client.query<{ id: string }>(
          `INSERT INTO crm.customers (
             organization_id, first_name, last_name, phone, email, preferred_contact_method
           ) VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            organizationId,
            data.customer.firstName,
            data.customer.lastName,
            data.customer.phone,
            data.customer.email || null,
            data.customer.preferredContactMethod || 'PHONE',
          ]
        );
        customerId = newCustomer.rows[0].id;
      }

      // Auto-assign to available agent (Round Robin strategy fallback)
      const agentRes = await client.query<{ user_id: string }>(
        `SELECT m.user_id FROM organizations.memberships m
         JOIN identity.roles r ON m.role_id = r.id
         WHERE m.organization_id = $1 AND r.code IN ('SALES_AGENT', 'SALES_MANAGER', 'TENANT_ADMIN') AND m.is_active = TRUE
         LIMIT 1`,
        [organizationId]
      );
      const assignedAgentId = agentRes.rows[0]?.user_id || null;

      // Insert Lead
      const leadRes = await client.query<{ id: string }>(
        `INSERT INTO crm.leads (
           organization_id, domain_id, customer_id, listing_id, assigned_agent_id,
           source, attribution_type, attribution_details, status, priority,
           inquiry_message, requirements, sla_deadline
         ) VALUES ($1, $2, $3, $4, $5, $6, 'FIRST_TOUCH', $7, 'NEW', $8, $9, $10, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
         RETURNING *`,
        [
          organizationId,
          data.domainId,
          customerId,
          data.listingId || null,
          assignedAgentId,
          data.source || 'PLATFORM',
          JSON.stringify(data.attributionDetails || {}),
          data.priority || 'MEDIUM',
          data.inquiryMessage || null,
          JSON.stringify(data.requirements || {}),
        ]
      );
      const createdLead = leadRes.rows[0];

      // Add initial activity
      await client.query(
        `INSERT INTO crm.lead_activities (lead_id, actor_id, type, subject, body)
         VALUES ($1, $2, 'NOTE', 'Inquiry Captured', $3)`,
        [createdLead.id, actorId || null, data.inquiryMessage || 'New inquiry created']
      );

      // Increment listing lead count if listing attached
      if (data.listingId) {
        await client.query(
          'UPDATE inventory.listings SET lead_count = lead_count + 1 WHERE id = $1',
          [data.listingId]
        );
      }

      await client.query('COMMIT');

      if (actorId) {
        await this.auditService.log({
          actorId,
          organizationId,
          resource: 'lead',
          resourceId: createdLead.id,
          action: 'lead.created',
        });
      }

      return createdLead;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateLeadStatus(
    leadId: string,
    status: string,
    organizationId: string,
    actorId: string,
    lostReason?: string
  ) {
    const updated = await dbPool.query(
      `UPDATE crm.leads
       SET status = $1, lost_reason = $2,
           qualified_at = CASE WHEN $1 = 'QUALIFIED' THEN CURRENT_TIMESTAMP ELSE qualified_at END,
           first_response_at = COALESCE(first_response_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND organization_id = $4
       RETURNING *`,
      [status, lostReason || null, leadId, organizationId]
    );

    if (updated.rows.length === 0) {
      throw new NotFoundException('Lead not found');
    }

    await dbPool.query(
      `INSERT INTO crm.lead_activities (lead_id, actor_id, type, subject, body)
       VALUES ($1, $2, 'STATUS_CHANGE', 'Status Updated', $3)`,
      [leadId, actorId, `Lead status changed to ${status}${lostReason ? `: ${lostReason}` : ''}`]
    );

    return updated.rows[0];
  }

  async addActivity(
    leadId: string,
    organizationId: string,
    type: string,
    subject: string,
    body: string,
    actorId: string
  ) {
    const leadCheck = await dbPool.query(
      'SELECT id FROM crm.leads WHERE id = $1 AND organization_id = $2',
      [leadId, organizationId]
    );
    if (leadCheck.rows.length === 0) {
      throw new NotFoundException('Lead not found');
    }

    const res = await dbPool.query(
      `INSERT INTO crm.lead_activities (lead_id, actor_id, type, subject, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [leadId, actorId, type, subject, body]
    );

    // Record first response if applicable
    await dbPool.query(
      'UPDATE crm.leads SET first_response_at = COALESCE(first_response_at, CURRENT_TIMESTAMP) WHERE id = $1',
      [leadId]
    );

    return res.rows[0];
  }

  // 2. Appointments / Site Visits
  async listAppointments(organizationId: string, agentId?: string) {
    let sql = `
      SELECT a.*, c.first_name as customer_first_name, c.last_name as customer_last_name, c.phone as customer_phone,
             u.first_name as host_first_name, u.last_name as host_last_name,
             list.title as listing_title, list.price as listing_price
      FROM sales.appointments a
      JOIN crm.customers c ON a.customer_id = c.id
      JOIN identity.users u ON a.host_agent_id = u.id
      LEFT JOIN inventory.listings list ON a.listing_id = list.id
      WHERE a.organization_id = $1
    `;
    const params: unknown[] = [organizationId];

    if (agentId) {
      params.push(agentId);
      sql += ` AND a.host_agent_id = $${params.length}`;
    }

    sql += ' ORDER BY a.scheduled_start ASC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async scheduleAppointment(
    organizationId: string,
    data: {
      leadId?: string | null;
      listingId?: string | null;
      customerId: string;
      hostAgentId: string;
      type: string;
      scheduledStart: string;
      scheduledEnd: string;
      location: string;
      notes?: string;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO sales.appointments (
         organization_id, lead_id, listing_id, customer_id, host_agent_id, type,
         scheduled_start, scheduled_end, location, notes, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SCHEDULED')
       RETURNING *`,
      [
        organizationId,
        data.leadId || null,
        data.listingId || null,
        data.customerId,
        data.hostAgentId,
        data.type,
        data.scheduledStart,
        data.scheduledEnd,
        data.location,
        data.notes || null,
      ]
    );

    if (data.leadId) {
      await dbPool.query(
        `INSERT INTO crm.lead_activities (lead_id, actor_id, type, subject, body)
         VALUES ($1, $2, 'SITE_VISIT', 'Appointment Scheduled', $3)`,
        [data.leadId, actorId, `Scheduled ${data.type} on ${data.scheduledStart} at ${data.location}`]
      );
      await dbPool.query(
        "UPDATE crm.leads SET status = 'APPOINTMENT_SCHEDULED' WHERE id = $1",
        [data.leadId]
      );
    }

    return res.rows[0];
  }

  // 3. Deals & Pipelines
  async listPipelines(organizationId: string, domainId?: string) {
    let sql = 'SELECT * FROM sales.pipelines WHERE organization_id = $1';
    const params: unknown[] = [organizationId];
    if (domainId) {
      params.push(domainId);
      sql += ` AND domain_id = $${params.length}`;
    }
    const res = await dbPool.query(sql, params);

    // Attach stages
    for (const p of res.rows) {
      const stagesRes = await dbPool.query(
        'SELECT * FROM sales.pipeline_stages WHERE pipeline_id = $1 ORDER BY stage_order ASC',
        [p.id]
      );
      p.stages = stagesRes.rows;
    }

    return res.rows;
  }

  async listDeals(organizationId: string, pipelineId?: string) {
    let sql = `
      SELECT d.*, c.first_name as customer_first_name, c.last_name as customer_last_name,
             u.first_name as agent_first_name, u.last_name as agent_last_name,
             ps.name as stage_name, ps.win_probability, ps.code as stage_code,
             list.title as listing_title
      FROM sales.deals d
      JOIN crm.customers c ON d.customer_id = c.id
      JOIN sales.pipeline_stages ps ON d.stage_id = ps.id
      LEFT JOIN identity.users u ON d.assigned_agent_id = u.id
      LEFT JOIN inventory.listings list ON d.listing_id = list.id
      WHERE d.organization_id = $1
    `;
    const params: unknown[] = [organizationId];

    if (pipelineId) {
      params.push(pipelineId);
      sql += ` AND d.pipeline_id = $${params.length}`;
    }

    sql += ' ORDER BY d.created_at DESC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async createDeal(
    organizationId: string,
    data: {
      domainId: string;
      pipelineId: string;
      stageId: string;
      leadId?: string | null;
      customerId: string;
      listingId?: string | null;
      assignedAgentId?: string | null;
      title: string;
      dealValue: number;
      currency?: string;
      expectedCloseDate?: string;
    },
    actorId: string
  ) {
    const res = await dbPool.query(
      `INSERT INTO sales.deals (
         organization_id, domain_id, pipeline_id, stage_id, lead_id, customer_id,
         listing_id, assigned_agent_id, title, deal_value, currency, expected_close_date, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'OPEN')
       RETURNING *`,
      [
        organizationId,
        data.domainId,
        data.pipelineId,
        data.stageId,
        data.leadId || null,
        data.customerId,
        data.listingId || null,
        data.assignedAgentId || null,
        data.title,
        data.dealValue,
        data.currency || 'ETB',
        data.expectedCloseDate || null,
      ]
    );

    await this.auditService.log({
      actorId,
      organizationId,
      resource: 'deal',
      resourceId: res.rows[0].id,
      action: 'deal.created',
      stateDiff: { deal: res.rows[0] },
    });

    return res.rows[0];
  }
}
