import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';

@Injectable()
export class CommercialService {
  constructor(private readonly auditService: AuditService) {}

  // 1. SaaS Plans
  async listPlans() {
    const res = await dbPool.query(
      'SELECT * FROM commercial.plans WHERE is_active = TRUE ORDER BY price ASC'
    );
    return res.rows;
  }

  // 2. Partner Contracts
  async listContracts(organizationId?: string) {
    let sql = `
      SELECT c.*, o.name as organization_name, o.slug as organization_slug,
             p.name as plan_name, p.price as plan_price
      FROM commercial.contracts c
      JOIN organizations.tenants o ON c.organization_id = o.id
      LEFT JOIN commercial.plans p ON c.plan_id = p.id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND c.organization_id = $${params.length}`;
    }
    sql += ' ORDER BY c.created_at DESC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getContract(contractId: string, organizationId?: string, isSuperAdmin = false) {
    const res = await dbPool.query(
      `SELECT c.*, o.name as organization_name, p.name as plan_name
       FROM commercial.contracts c
       JOIN organizations.tenants o ON c.organization_id = o.id
       LEFT JOIN commercial.plans p ON c.plan_id = p.id
       WHERE c.id = $1`,
      [contractId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Contract not found');
    }
    const contract = res.rows[0];
    if (!isSuperAdmin && organizationId && contract.organization_id !== organizationId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    // Attach fee rules
    const rulesRes = await dbPool.query(
      'SELECT * FROM commercial.fee_rules WHERE contract_id = $1',
      [contractId]
    );
    contract.feeRules = rulesRes.rows;

    // Attach versions
    const versionsRes = await dbPool.query(
      'SELECT * FROM commercial.contract_versions WHERE contract_id = $1 ORDER BY version_number DESC',
      [contractId]
    );
    contract.versions = versionsRes.rows;

    return contract;
  }

  // 3. Deterministic Waterfall Fee Calculation & Ledger Posting
  async calculateAndPostFeeEvent(
    data: {
      organizationId: string;
      contractId: string;
      dealId?: string | null;
      listingId?: string | null;
      leadId?: string | null;
      agentId?: string | null;
      triggerEvent: string;
      grossTransactionValue: number;
      currency?: string;
      idempotencyKey?: string;
    },
    actorId: string
  ) {
    // 1. Check idempotency
    if (data.idempotencyKey) {
      const existing = await dbPool.query(
        'SELECT * FROM commercial.fee_events WHERE idempotency_key = $1',
        [data.idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return existing.rows[0];
      }
    }

    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      // 2. Fetch contract and governing terms
      const contractRes = await client.query<{
        id: string;
        version: number;
        terms: any;
      }>(
        'SELECT id, version, terms FROM commercial.contracts WHERE id = $1 AND status = \'ACTIVE\'',
        [data.contractId]
      );
      if (contractRes.rows.length === 0) {
        throw new BadRequestException('Active commercial contract not found');
      }
      const contract = contractRes.rows[0];

      // 3. Evaluate fee rule
      const platformFeeRate = contract.terms?.platformFeeRate || 2.0; // default 2%
      const agentCommissionRate = contract.terms?.agentCommissionRate || 1.0; // default 1%

      const platformFeeAmount = (data.grossTransactionValue * platformFeeRate) / 100;
      const agentCommissionAmount = (data.grossTransactionValue * agentCommissionRate) / 100;
      const partnerNetShare = data.grossTransactionValue - platformFeeAmount - agentCommissionAmount;

      // 4. Insert fee event
      const feeEventRes = await client.query<{ id: string }>(
        `INSERT INTO commercial.fee_events (
           organization_id, contract_id, contract_version, deal_id, listing_id,
           lead_id, agent_id, trigger_event, calculation_basis, calculated_amount,
           currency, status, idempotency_key, earned_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'EARNED', $12, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          data.organizationId,
          contract.id,
          contract.version,
          data.dealId || null,
          data.listingId || null,
          data.leadId || null,
          data.agentId || null,
          data.triggerEvent,
          data.grossTransactionValue,
          platformFeeAmount,
          data.currency || 'ETB',
          data.idempotencyKey || null,
        ]
      );
      const feeEvent = feeEventRes.rows[0];

      // 5. Post to Financial Ledger (Append-only immutable record)
      const refNumber = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        `INSERT INTO finance.financial_ledger (
           organization_id, contract_id, deal_id, fee_event_id, entry_type,
           debit_amount, credit_amount, currency, balance_after, reference_number, notes
         ) VALUES ($1, $2, $3, $4, 'PLATFORM_FEE', $5, 0.00, $6, $7, $8, $9)`,
        [
          data.organizationId,
          contract.id,
          data.dealId || null,
          feeEvent.id,
          platformFeeAmount,
          data.currency || 'ETB',
          -platformFeeAmount,
          refNumber,
          `Platform success fee on deal: ${data.dealId || 'N/A'} (Rate: ${platformFeeRate}%)`,
        ]
      );

      if (data.agentId && agentCommissionAmount > 0) {
        await client.query(
          `INSERT INTO finance.financial_ledger (
             organization_id, contract_id, deal_id, fee_event_id, entry_type,
             debit_amount, credit_amount, currency, balance_after, reference_number, notes
           ) VALUES ($1, $2, $3, $4, 'AGENT_COMMISSION', $5, 0.00, $6, $7, $8, $9)`,
          [
            data.organizationId,
            contract.id,
            data.dealId || null,
            feeEvent.id,
            agentCommissionAmount,
            data.currency || 'ETB',
            -agentCommissionAmount,
            `${refNumber}-AGT`,
            `Sales agent commission for user ${data.agentId} (Rate: ${agentCommissionRate}%)`,
          ]
        );
      }

      await client.query('COMMIT');

      await this.auditService.log({
        actorId,
        organizationId: data.organizationId,
        resource: 'commercial_ledger',
        resourceId: feeEvent.id,
        action: 'fee_event.calculated',
        stateDiff: {
          gross: data.grossTransactionValue,
          platformFee: platformFeeAmount,
          agentCommission: agentCommissionAmount,
          partnerNet: partnerNetShare,
        },
      });

      return {
        feeEvent,
        waterfall: {
          grossTransactionValue: data.grossTransactionValue,
          platformFeeAmount,
          agentCommissionAmount,
          partnerNetShare,
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 4. Financial Ledger Feeds
  async listLedgerEntries(organizationId: string, limit = 50) {
    const res = await dbPool.query(
      `SELECT l.*, o.name as organization_name
       FROM finance.financial_ledger l
       JOIN organizations.tenants o ON l.organization_id = o.id
       WHERE l.organization_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2`,
      [organizationId, limit]
    );
    return res.rows;
  }

  // 5. Invoices & Billing
  async listInvoices(organizationId: string) {
    const res = await dbPool.query(
      `SELECT * FROM finance.invoices
       WHERE organization_id = $1
       ORDER BY issued_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async createInvoice(
    organizationId: string,
    data: {
      type: string;
      subtotal: number;
      taxAmount?: number;
      currency?: string;
      dueDate: string;
      items: Array<{ description: string; quantity: number; unitPrice: number; totalAmount: number }>;
    },
    actorId: string
  ) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const totalAmount = data.subtotal + (data.taxAmount || 0);

      const invRes = await client.query<{ id: string }>(
        `INSERT INTO finance.invoices (
           organization_id, invoice_number, type, subtotal, tax_amount, total_amount, currency, due_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          organizationId,
          invoiceNumber,
          data.type,
          data.subtotal,
          data.taxAmount || 0,
          totalAmount,
          data.currency || 'ETB',
          data.dueDate,
        ]
      );
      const invoice = invRes.rows[0];

      for (const item of data.items) {
        await client.query(
          `INSERT INTO finance.invoice_items (invoice_id, description, quantity, unit_price, total_amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoice.id, item.description, item.quantity, item.unitPrice, item.totalAmount]
        );
      }

      await client.query('COMMIT');

      await this.auditService.log({
        actorId,
        organizationId,
        resource: 'invoice',
        resourceId: invoice.id,
        action: 'invoice.issued',
      });

      return invoice;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 6. Partner Settlement Statements
  async generateSettlement(
    organizationId: string,
    periodStart: string,
    periodEnd: string,
    actorId: string
  ) {
    const statsRes = await dbPool.query<{
      gross: string;
      platform_fees: string;
      agent_commissions: string;
    }>(
      `SELECT 
         COALESCE(SUM(calculation_basis), 0) as gross,
         COALESCE(SUM(calculated_amount), 0) as platform_fees
       FROM commercial.fee_events
       WHERE organization_id = $1 AND status = 'EARNED'
         AND created_at >= $2::timestamptz AND created_at <= $3::timestamptz`,
      [organizationId, periodStart, periodEnd]
    );

    const gross = parseFloat(statsRes.rows[0]?.gross || '0');
    const platformFees = parseFloat(statsRes.rows[0]?.platform_fees || '0');
    const agentCommissions = gross * 0.01; // 1%
    const netToPartner = gross - platformFees - agentCommissions;

    const statementNumber = `SET-${Date.now().toString().slice(-6)}`;
    const res = await dbPool.query(
      `INSERT INTO finance.settlements (
         organization_id, statement_number, period_start, period_end,
         total_gross_sales, total_platform_fees, total_agent_commissions, net_payable_to_partner, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING *`,
      [
        organizationId,
        statementNumber,
        periodStart,
        periodEnd,
        gross,
        platformFees,
        agentCommissions,
        netToPartner,
      ]
    );

    await this.auditService.log({
      actorId,
      organizationId,
      resource: 'settlement',
      resourceId: res.rows[0].id,
      action: 'settlement.generated',
    });

    return res.rows[0];
  }

  // 7. Commercial Disputes & Compensating Adjustments
  async fileDispute(
    organizationId: string,
    feeEventId: string,
    reason: string,
    requestedAdjustment?: number,
    actorId?: string
  ) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const disputeRes = await client.query<{ id: string }>(
        `INSERT INTO commercial.disputes (
           organization_id, fee_event_id, reason, requested_adjustment, status
         ) VALUES ($1, $2, $3, $4, 'OPENED')
         RETURNING *`,
        [organizationId, feeEventId, reason, requestedAdjustment || null]
      );

      // Move fee event to DISPUTED status (holding fund)
      await client.query(
        "UPDATE commercial.fee_events SET status = 'DISPUTED' WHERE id = $1",
        [feeEventId]
      );

      await client.query('COMMIT');

      if (actorId) {
        await this.auditService.log({
          actorId,
          organizationId,
          resource: 'dispute',
          resourceId: disputeRes.rows[0].id,
          action: 'dispute.opened',
          stateDiff: { feeEventId, reason },
        });
      }

      return disputeRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async resolveDispute(
    disputeId: string,
    status: 'ACCEPTED' | 'REJECTED' | 'ADJUSTED',
    resolutionNotes: string,
    actorId: string
  ) {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const disputeRes = await client.query<{
        id: string;
        organization_id: string;
        fee_event_id: string;
        requested_adjustment: number | null;
      }>('SELECT * FROM commercial.disputes WHERE id = $1', [disputeId]);

      if (disputeRes.rows.length === 0) {
        throw new NotFoundException('Dispute not found');
      }
      const dispute = disputeRes.rows[0];

      await client.query(
        `UPDATE commercial.disputes
         SET status = $1, resolution_notes = $2, resolved_by = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [status, resolutionNotes, actorId, disputeId]
      );

      if (status === 'ACCEPTED' || status === 'ADJUSTED') {
        // Compensating ledger adjustment (Never edit history in place!)
        const adjustmentAmount = dispute.requested_adjustment || 0;
        await client.query(
          `INSERT INTO finance.financial_ledger (
             organization_id, fee_event_id, entry_type, debit_amount, credit_amount,
             currency, balance_after, reference_number, notes
           ) VALUES ($1, $2, 'ADJUSTMENT', 0.00, $3, 'ETB', $3, $4, $5)`,
          [
            dispute.organization_id,
            dispute.fee_event_id,
            adjustmentAmount,
            `ADJ-DISP-${disputeId.slice(0, 8)}`,
            `Approved dispute adjustment: ${resolutionNotes}`,
          ]
        );
        await client.query(
          "UPDATE commercial.fee_events SET status = 'EARNED' WHERE id = $1",
          [dispute.fee_event_id]
        );
      } else {
        await client.query(
          "UPDATE commercial.fee_events SET status = 'EARNED' WHERE id = $1",
          [dispute.fee_event_id]
        );
      }

      await client.query('COMMIT');
      return { disputeId, status, resolutionNotes };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
