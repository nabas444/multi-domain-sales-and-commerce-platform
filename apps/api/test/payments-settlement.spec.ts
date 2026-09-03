import { PaymentsService } from '../src/modules/payments/payments.service.js';
import { AuditService } from '../src/common/audit/audit.service.js';
import { dbPool } from '@platform/database';

jest.setTimeout(30000);

describe('Payments & Commercial Settlement Integration Suite', () => {
  let paymentsService: PaymentsService;
  let auditService: AuditService;
  let partnerId: string;
  let adminId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    auditService = new AuditService();
    paymentsService = new PaymentsService(auditService);

    const orgRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM organizations.tenants WHERE slug = 'apex-real-estate'"
    );
    partnerId = orgRes.rows[0].id;

    const userRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM identity.users WHERE email = 'admin@platform.local'"
    );
    adminId = userRes.rows[0].id;

    // Create a temporary invoice for settlement testing
    const invRes = await dbPool.query<{ id: string }>(
      `INSERT INTO finance.invoices (
         organization_id, invoice_number, type, subtotal, tax_amount, total_amount, currency, status, due_date
       ) VALUES ($1, $2, 'COMMISSION', 50000.00, 7500.00, 57500.00, 'ETB', 'ISSUED', CURRENT_DATE + INTERVAL '14 days')
       RETURNING id`,
      [partnerId, `INV-TEST-${Date.now()}`]
    );
    testInvoiceId = invRes.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test invoice & payments
    if (testInvoiceId) {
      await dbPool.query('DELETE FROM finance.payments WHERE invoice_id = $1', [testInvoiceId]);
      await dbPool.query('DELETE FROM finance.invoices WHERE id = $1', [testInvoiceId]);
    }
  });

  it('MUST create a pending Telebirr payment intent with USSD and checkout data', async () => {
    const result = await paymentsService.createPaymentIntent(
      {
        organizationId: partnerId,
        invoiceId: testInvoiceId,
        amount: 57500.00,
        currency: 'ETB',
        paymentMethod: 'TELEBIRR',
      },
      adminId
    );

    expect(result.payment).toBeDefined();
    expect(result.payment.status).toBe('PENDING');
    expect(result.payment.amount).toBe('57500.00');
    expect(result.checkout).toBeDefined();
    expect(result.checkout.checkoutUrl).toContain('telebirr.et');
    expect(result.checkout.ussdShortcode).toContain('*127*57500#');
  });

  it('MUST idempotently reconcile gateway webhook and mark invoice as PAID', async () => {
    // Create intent
    const { payment } = await paymentsService.createPaymentIntent(
      {
        organizationId: partnerId,
        invoiceId: testInvoiceId,
        amount: 57500.00,
        currency: 'ETB',
        paymentMethod: 'TELEBIRR',
      },
      adminId
    );

    // Simulate gateway webhook delivery
    const webhookRes = await paymentsService.handleGatewayWebhook({
      provider: 'telebirr',
      referenceNumber: payment.reference_number,
      status: 'COMPLETED',
      amount: 57500.00,
      currency: 'ETB',
      transactionId: `TB-TX-${Date.now()}`,
    });

    expect(webhookRes.success).toBe(true);
    expect(webhookRes.status).toBe('COMPLETED');

    // Verify invoice status is now PAID
    const invCheck = await dbPool.query<{ status: string; paid_at: string }>(
      'SELECT status, paid_at FROM finance.invoices WHERE id = $1',
      [testInvoiceId]
    );
    expect(invCheck.rows[0].status).toBe('PAID');
    expect(invCheck.rows[0].paid_at).toBeDefined();

    // Idempotency: second webhook with same reference must return ALREADY_PROCESSED
    const secondWebhook = await paymentsService.handleGatewayWebhook({
      provider: 'telebirr',
      referenceNumber: payment.reference_number,
      status: 'COMPLETED',
      amount: 57500.00,
      currency: 'ETB',
      transactionId: `TB-TX-${Date.now()}-DUPLICATE`,
    });

    expect(secondWebhook.status).toBe('ALREADY_PROCESSED');
  });
});
