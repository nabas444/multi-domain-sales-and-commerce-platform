import { AnalyticsService } from '../src/modules/analytics/analytics.service.js';
import { ModerationService } from '../src/modules/moderation/moderation.service.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';
import { IntegrationsService } from '../src/modules/integrations/integrations.service.js';
import { AuditService } from '../src/common/audit/audit.service.js';
import { dbPool } from '@platform/database';

jest.setTimeout(30000);

describe('Core Backend Modules Extension Suite (Analytics, Moderation, Notifications, Integrations)', () => {
  let auditService: AuditService;
  let analyticsService: AnalyticsService;
  let moderationService: ModerationService;
  let notificationsService: NotificationsService;
  let integrationsService: IntegrationsService;

  let partnerId: string;
  let adminId: string;

  beforeAll(async () => {
    auditService = new AuditService();
    analyticsService = new AnalyticsService();
    moderationService = new ModerationService(auditService);
    notificationsService = new NotificationsService();
    integrationsService = new IntegrationsService(auditService);

    const orgRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM organizations.tenants WHERE slug = 'apex-real-estate'"
    );
    partnerId = orgRes.rows[0].id;

    const userRes = await dbPool.query<{ id: string }>(
      "SELECT id FROM identity.users WHERE email = 'admin@platform.local'"
    );
    adminId = userRes.rows[0].id;
  });

  describe('1. Analytics Engine (Spec Section 25)', () => {
    it('MUST compute executive overview metrics across inventory, leads, and commercial fees', async () => {
      const overview = await analyticsService.getExecutiveOverview(partnerId);

      expect(overview).toBeDefined();
      expect(overview.currency).toBe('ETB');
      expect(typeof overview.totalListings).toBe('number');
      expect(typeof overview.grossMerchandiseValue).toBe('number');
      expect(typeof overview.platformFeesEarned).toBe('number');
    });

    it('MUST compute sales pipeline conversion funnel metrics', async () => {
      const funnel = await analyticsService.getSalesFunnelMetrics(partnerId);

      expect(funnel).toBeDefined();
      expect(Array.isArray(funnel.stages)).toBe(true);
      expect(typeof funnel.winRate).toBe('number');
    });
  });

  describe('2. Verification & Moderation Workflows (Spec Section 16.1)', () => {
    let testListingId: string;

    beforeAll(async () => {
      // Create a test listing in PENDING_REVIEW
      const catRes = await dbPool.query<{ id: string; domain_id: string }>(
        "SELECT id, domain_id FROM domains.categories WHERE slug = 'apartments'"
      );
      const cat = catRes.rows[0];

      const res = await dbPool.query<{ id: string }>(
        `INSERT INTO inventory.listings (
           organization_id, domain_id, category_id, title, slug, price, currency, status, moderation_status
         ) VALUES ($1, $2, $3, 'Moderation Test Penthouse', $4, 12000000.00, 'ETB', 'PENDING_REVIEW', 'PENDING')
         RETURNING id`,
        [partnerId, cat.domain_id, cat.id, `mod-test-${Date.now()}`]
      );
      testListingId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testListingId) {
        await dbPool.query('DELETE FROM inventory.listings WHERE id = $1', [testListingId]);
      }
    });

    it('MUST return pending listings in the moderation queue', async () => {
      const queue = await moderationService.getListingModerationQueue({ status: 'PENDING' });

      expect(Array.isArray(queue)).toBe(true);
      const found = queue.find((item) => item.id === testListingId);
      expect(found).toBeDefined();
    });

    it('MUST transition listing status to PUBLISHED and record audited approval', async () => {
      const approved = await moderationService.reviewListing(
        testListingId,
        {
          action: 'APPROVE',
          reasonCode: 'COMPLIANCE_VERIFIED',
          notes: 'All title deed documentation matches Addis Ababa land registry records.',
        },
        adminId
      );

      expect(approved.status).toBe('PUBLISHED');
      expect(approved.moderation_status).toBe('APPROVED');
      expect(approved.published_at).toBeDefined();

      // Verify audit log entry
      const auditRes = await dbPool.query(
        "SELECT * FROM audit.audit_logs WHERE resource_id = $1 AND action = 'moderation.listing_approve'",
        [testListingId]
      );
      expect(auditRes.rows.length).toBeGreaterThan(0);
      expect(auditRes.rows[0].actor_id).toBe(adminId);
    });

    it('MUST verify partner KYC verification status', async () => {
      const verified = await moderationService.reviewPartnerVerification(
        partnerId,
        { status: 'VERIFIED', notes: 'Business license and tax identification number verified.' },
        adminId
      );

      expect(verified.status).toBe('APPROVED');
      expect(verified.verified_at).toBeDefined();
    });
  });

  describe('3. Multi-Channel Notifications (Spec Section 24)', () => {
    let notificationId: string;

    it('MUST dispatch an in-app notification and update unread count', async () => {
      const initialCount = await notificationsService.getUnreadCount(adminId);

      const notification = await notificationsService.dispatch({
        userId: adminId,
        organizationId: partnerId,
        title: 'High Priority Lead Assigned',
        message: 'A prospective buyer requested a site visit for Bole Atlas Penthouse.',
        channel: 'IN_APP',
        linkUrl: '/crm/leads/lead-101',
      });

      expect(notification).toBeDefined();
      expect(notification.is_read).toBe(false);
      notificationId = notification.id;

      const newCount = await notificationsService.getUnreadCount(adminId);
      expect(newCount).toBe(initialCount + 1);
    });

    it('MUST mark individual notification as read', async () => {
      const updated = await notificationsService.markAsRead(notificationId, adminId);
      expect(updated.is_read).toBe(true);
    });
  });

  describe('4. Integrations & Signed Outbound Webhooks (Spec Section 19.3)', () => {
    let webhookId: string;

    it('MUST register an outbound webhook with secure HMAC signing secret', async () => {
      const webhook = await integrationsService.registerWebhook(
        partnerId,
        {
          url: 'https://webhook.site/test-endpoint',
          eventTypes: ['lead.created', 'deal.closed'],
        },
        adminId
      );

      expect(webhook).toBeDefined();
      expect(webhook.id).toBeDefined();
      expect(webhook.secret).toMatch(/^whsec_[a-f0-9]{48}$/);
      expect(webhook.is_active).toBe(true);
      webhookId = webhook.id;
    });

    it('MUST list registered webhooks for tenant', async () => {
      const list = await integrationsService.listWebhooks(partnerId);
      expect(Array.isArray(list)).toBe(true);
      const found = list.find((w) => w.id === webhookId);
      expect(found).toBeDefined();
    });

    it('MUST remove webhook subscription cleanly', async () => {
      const res = await integrationsService.deleteWebhook(webhookId, partnerId, adminId);
      expect(res.success).toBe(true);
    });
  });
});
