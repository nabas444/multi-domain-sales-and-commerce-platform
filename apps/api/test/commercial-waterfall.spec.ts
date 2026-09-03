import { CommercialService } from '../src/modules/commercial/commercial.service.js';
import { AuditService } from '../src/common/audit/audit.service.js';
import { dbPool } from '@platform/database';

describe('Commercial Engine & Financial Waterfall Suite', () => {
  let commercialService: CommercialService;
  let auditService: AuditService;

  beforeAll(() => {
    auditService = new AuditService();
    commercialService = new CommercialService(auditService);
  });

  it('MUST calculate deterministic waterfall distribution on deal close', async () => {
    const partnerRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM organizations.tenants WHERE slug = 'apex-real-estate'"
    );
    const contractRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM commercial.contracts WHERE contract_number = 'CNT-APEX-2026-001'"
    );

    const partnerId = partnerRes.rows[0].id;
    const contractId = contractRes.rows[0].id;
    const transactionValue = 10000000.00; // 10,000,000 ETB

    const adminRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM identity.users WHERE email = 'admin@platform.local'"
    );
    const adminId = adminRes.rows[0].id;

    const idempotencyKey = `TEST-IDEMP-${Date.now()}`;
    const result = await commercialService.calculateAndPostFeeEvent({
      organizationId: partnerId,
      contractId,
      triggerEvent: 'deal.closed',
      grossTransactionValue: transactionValue,
      currency: 'ETB',
      idempotencyKey,
    }, adminId);

    expect(result).toBeDefined();
    expect(result.waterfall).toBeDefined();
    // 2.0% of 10,000,000 = 200,000
    expect(result.waterfall.platformFeeAmount).toBe(200000);
    // 1.0% of 10,000,000 = 100,000
    expect(result.waterfall.agentCommissionAmount).toBe(100000);
    // Partner net share = 10M - 200k - 100k = 9,700,000
    expect(result.waterfall.partnerNetShare).toBe(9700000);

    // Ledger posting verification
    const ledgerRes = await dbPool.query(
      'SELECT * FROM finance.financial_ledger WHERE fee_event_id = $1',
      [result.feeEvent.id]
    );
    expect(ledgerRes.rows.length).toBeGreaterThan(0);
    expect(parseFloat(ledgerRes.rows[0].debit_amount)).toBe(200000);
  });

  it('MUST enforce idempotency when same trigger event is submitted twice', async () => {
    const partnerRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM organizations.tenants WHERE slug = 'apex-real-estate'"
    );
    const contractRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM commercial.contracts WHERE contract_number = 'CNT-APEX-2026-001'"
    );

    const partnerId = partnerRes.rows[0].id;
    const contractId = contractRes.rows[0].id;
    const idempotencyKey = `TEST-DUP-${Date.now()}`;

    const adminRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM identity.users WHERE email = 'admin@platform.local'"
    );
    const adminId = adminRes.rows[0].id;

    const res1 = await commercialService.calculateAndPostFeeEvent({
      organizationId: partnerId,
      contractId,
      triggerEvent: 'deal.closed',
      grossTransactionValue: 5000000,
      idempotencyKey,
    }, adminId);

    const res2 = await commercialService.calculateAndPostFeeEvent({
      organizationId: partnerId,
      contractId,
      triggerEvent: 'deal.closed',
      grossTransactionValue: 5000000,
      idempotencyKey,
    }, adminId);

    expect(res1.feeEvent.id).toBe(res2.id);
  });
});
