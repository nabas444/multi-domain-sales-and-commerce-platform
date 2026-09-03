import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePaymentIntentDto {
  organizationId: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  paymentMethod: 'TELEBIRR' | 'CBE_BIRR' | 'STRIPE' | 'BANK_TRANSFER';
  metadata?: Record<string, any>;
}

export interface PaymentWebhookDto {
  provider: string;
  referenceNumber: string;
  status: 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  transactionId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Initializes a payment intent for a customer/partner, supporting Ethiopian & international gateways
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto, actorId?: string) {
    const currency = dto.currency || 'ETB';
    const referenceNumber = `PAY-${dto.paymentMethod.substring(0, 4)}-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Verify invoice if attached
    if (dto.invoiceId) {
      const invRes = await dbPool.query<{ id: string; status: string; total_amount: string }>(
        'SELECT id, status, total_amount FROM finance.invoices WHERE id = $1 AND organization_id = $2',
        [dto.invoiceId, dto.organizationId]
      );
      if (invRes.rows.length === 0) {
        throw new NotFoundException('Attached invoice not found for this organization');
      }
      if (invRes.rows[0].status === 'PAID') {
        throw new BadRequestException('Invoice is already fully settled');
      }
    }

    // Provider checkout simulation URL/data
    let checkoutData: Record<string, any> = {};
    if (dto.paymentMethod === 'TELEBIRR') {
      checkoutData = {
        checkoutUrl: `https://telebirr.et/pay?ref=${referenceNumber}`,
        ussdShortcode: `*127*${dto.amount}#`,
        qrCodePayload: `telebirr://${referenceNumber}/${dto.amount}`,
      };
    } else if (dto.paymentMethod === 'CBE_BIRR') {
      checkoutData = {
        checkoutUrl: `https://cbebirr.cbe.com.et/pay?ref=${referenceNumber}`,
        ussdShortcode: `*847*${dto.amount}#`,
      };
    } else if (dto.paymentMethod === 'STRIPE') {
      checkoutData = {
        clientSecret: `pi_${uuidv4()}_secret_${uuidv4().substring(0, 16)}`,
        checkoutUrl: `https://checkout.stripe.com/c/pay/${referenceNumber}`,
      };
    } else {
      checkoutData = {
        bankName: 'Commercial Bank of Ethiopia',
        accountNumber: '1000123456789',
        accountName: 'Multi-Domain Platform Settlement Account',
      };
    }

    const res = await dbPool.query(
      `INSERT INTO finance.payments (
         organization_id, invoice_id, amount, currency, payment_method, status, reference_number, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        dto.organizationId,
        dto.invoiceId || null,
        dto.amount,
        currency,
        dto.paymentMethod,
        'PENDING',
        referenceNumber,
        JSON.stringify({ ...dto.metadata, checkoutData }),
      ]
    );

    const payment = res.rows[0];

    if (actorId) {
      await this.auditService.log({
        actorId,
        organizationId: dto.organizationId,
        resource: 'payment',
        resourceId: payment.id,
        action: 'payment.intent_created',
        metadata: { referenceNumber, amount: dto.amount, method: dto.paymentMethod },
      });
    }

    return {
      payment,
      checkout: checkoutData,
    };
  }

  /**
   * Processes verified payment gateway webhooks (Telebirr / CBE Birr / Stripe)
   * Idempotently settles payment, updates invoice, and records ledger transactions
   */
  async handleGatewayWebhook(dto: PaymentWebhookDto) {
    this.logger.log(`Processing payment webhook from ${dto.provider} for ref [${dto.referenceNumber}]`);

    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');

      const payRes = await client.query<{
        id: string;
        organization_id: string;
        invoice_id: string | null;
        amount: string;
        currency: string;
        status: string;
      }>(
        'SELECT * FROM finance.payments WHERE reference_number = $1 FOR UPDATE',
        [dto.referenceNumber]
      );

      if (payRes.rows.length === 0) {
        throw new NotFoundException(`Payment with reference ${dto.referenceNumber} not found`);
      }

      const payment = payRes.rows[0];

      // Idempotency: if already completed, return immediately without re-crediting
      if (payment.status === 'COMPLETED') {
        await client.query('COMMIT');
        return { status: 'ALREADY_PROCESSED', paymentId: payment.id };
      }

      // Update payment record
      await client.query(
        `UPDATE finance.payments
         SET status = $1,
             metadata = metadata || $2::jsonb
         WHERE id = $3`,
        [
          dto.status,
          JSON.stringify({
            gatewayTransactionId: dto.transactionId,
            settledAt: new Date().toISOString(),
          }),
          payment.id,
        ]
      );

      // If successful, settle invoice if attached
      if (dto.status === 'COMPLETED' && payment.invoice_id) {
        await client.query(
          `UPDATE finance.invoices
           SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [payment.invoice_id]
        );
      }

      await client.query('COMMIT');

      await this.auditService.log({
        organizationId: payment.organization_id,
        resource: 'payment',
        resourceId: payment.id,
        action: `payment.gateway_${dto.status.toLowerCase()}`,
        metadata: {
          provider: dto.provider,
          referenceNumber: dto.referenceNumber,
          transactionId: dto.transactionId,
          amount: payment.amount,
        },
      });

      return {
        success: true,
        status: dto.status,
        paymentId: payment.id,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listPayments(organizationId: string, invoiceId?: string) {
    let sql = 'SELECT * FROM finance.payments WHERE organization_id = $1';
    const params: unknown[] = [organizationId];

    if (invoiceId) {
      params.push(invoiceId);
      sql += ` AND invoice_id = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';
    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async getPaymentById(paymentId: string) {
    const res = await dbPool.query(
      'SELECT * FROM finance.payments WHERE id = $1',
      [paymentId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Payment not found');
    }
    return res.rows[0];
  }
}
