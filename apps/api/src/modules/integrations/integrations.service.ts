import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { dbPool } from '@platform/database';
import { AuditService } from '../../common/audit/audit.service.js';
import crypto from 'crypto';

export interface RegisterWebhookDto {
  url: string;
  eventTypes: string[];
}

export interface DomainEvent<T = any> {
  organizationId: string;
  eventType: string;
  payload: T;
  correlationId?: string;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Registers a new outbound webhook subscriber with auto-generated HMAC signing secret
   */
  async registerWebhook(organizationId: string, dto: RegisterWebhookDto, actorId: string) {
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const res = await dbPool.query(
      `INSERT INTO platform.webhooks (
         organization_id, url, secret, event_types, is_active
       ) VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, organization_id, url, secret, event_types, is_active, created_at`,
      [organizationId, dto.url, secret, JSON.stringify(dto.eventTypes)]
    );

    const webhook = res.rows[0];

    await this.auditService.log({
      actorId,
      organizationId,
      resource: 'webhook',
      resourceId: webhook.id,
      action: 'webhook.registered',
      metadata: { url: dto.url, eventTypes: dto.eventTypes },
    });

    return webhook;
  }

  async listWebhooks(organizationId: string) {
    const res = await dbPool.query(
      `SELECT id, organization_id, url, event_types, is_active, created_at,
              (SELECT COUNT(*)::int FROM platform.webhook_deliveries WHERE webhook_id = platform.webhooks.id) as total_deliveries
       FROM platform.webhooks
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async deleteWebhook(webhookId: string, organizationId: string, actorId: string) {
    const res = await dbPool.query(
      'DELETE FROM platform.webhooks WHERE id = $1 AND organization_id = $2 RETURNING id',
      [webhookId, organizationId]
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Webhook subscription not found');
    }

    await this.auditService.log({
      actorId,
      organizationId,
      resource: 'webhook',
      resourceId: webhookId,
      action: 'webhook.deleted',
    });

    return { success: true };
  }

  /**
   * Dispatches signed domain events to all subscribed webhooks with HMAC-SHA256
   */
  async emitDomainEvent(event: DomainEvent) {
    const { organizationId, eventType, payload, correlationId } = event;

    // Find active webhooks for this organization subscribed to this event
    const webhooksRes = await dbPool.query<{
      id: string;
      url: string;
      secret: string;
      event_types: string[];
    }>(
      `SELECT id, url, secret, event_types
       FROM platform.webhooks
       WHERE organization_id = $1 AND is_active = TRUE AND event_types @> $2::jsonb`,
      [organizationId, JSON.stringify([eventType])]
    );

    const subscribers = webhooksRes.rows;
    if (subscribers.length === 0) {
      return { dispatched: 0 };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const bodyString = JSON.stringify({
      id: crypto.randomUUID(),
      eventType,
      organizationId,
      timestamp,
      data: payload,
    });

    const deliveryPromises = subscribers.map(async (wh) => {
      // Calculate HMAC SHA-256 signature
      const signature = crypto
        .createHmac('sha256', wh.secret)
        .update(`${timestamp}.${bodyString}`)
        .digest('hex');

      let statusCode: number | null = null;
      let responseText: string | null = null;
      let succeeded = false;

      try {
        const response = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Platform-Signature': `t=${timestamp},v1=${signature}`,
            'X-Platform-Event': eventType,
            'X-Correlation-Id': correlationId || crypto.randomUUID(),
          },
          body: bodyString,
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        statusCode = response.status;
        responseText = (await response.text()).substring(0, 500);
        succeeded = response.ok;
      } catch (err: any) {
        responseText = err.message || 'Delivery connection error';
        succeeded = false;
      }

      // Record delivery log
      await dbPool.query(
        `INSERT INTO platform.webhook_deliveries (
           webhook_id, event_type, payload, status_code, response_body, attempt, succeeded
         ) VALUES ($1, $2, $3, $4, $5, 1, $6)`,
        [
          wh.id,
          eventType,
          JSON.stringify(payload),
          statusCode,
          responseText,
          succeeded,
        ]
      );

      return { webhookId: wh.id, succeeded, statusCode };
    });

    const results = await Promise.all(deliveryPromises);
    return {
      dispatched: subscribers.length,
      results,
    };
  }

  async getWebhookDeliveries(webhookId: string, organizationId: string) {
    // Verify ownership
    const whCheck = await dbPool.query(
      'SELECT id FROM platform.webhooks WHERE id = $1 AND organization_id = $2',
      [webhookId, organizationId]
    );
    if (whCheck.rows.length === 0) {
      throw new NotFoundException('Webhook subscription not found');
    }

    const res = await dbPool.query(
      `SELECT * FROM platform.webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [webhookId]
    );
    return res.rows;
  }
}
