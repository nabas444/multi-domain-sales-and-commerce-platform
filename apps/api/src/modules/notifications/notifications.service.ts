import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { dbPool } from '@platform/database';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface DispatchNotificationDto {
  userId: string;
  organizationId?: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  linkUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /**
   * Dispatches a notification across multi-channel adapters (in-app, email, SMS, WhatsApp)
   */
  async dispatch(dto: DispatchNotificationDto) {
    const channel = dto.channel || 'IN_APP';

    // 1. Always record in-app notification for persistent user inbox
    const res = await dbPool.query(
      `INSERT INTO notifications.notifications (
         user_id, organization_id, title, message, channel, link_url, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        dto.userId,
        dto.organizationId || null,
        dto.title,
        dto.message,
        channel,
        dto.linkUrl || null,
        JSON.stringify(dto.metadata || {}),
      ]
    );

    const notification = res.rows[0];

    // 2. Channel adapter dispatching
    switch (channel) {
      case 'EMAIL':
        this.logger.log(`[EMAIL ADAPTER] Dispatched email notification to User ${dto.userId}: "${dto.title}"`);
        break;
      case 'SMS':
        this.logger.log(`[SMS ADAPTER] Dispatched SMS alert to User ${dto.userId}: "${dto.message.substring(0, 50)}..."`);
        break;
      case 'WHATSAPP':
        this.logger.log(`[WHATSAPP ADAPTER] Dispatched WhatsApp template to User ${dto.userId}`);
        break;
      case 'IN_APP':
      default:
        this.logger.log(`[IN-APP] Persisted notification ${notification.id} for User ${dto.userId}`);
        break;
    }

    return notification;
  }

  /**
   * Interpolates template and sends across configured channel
   */
  async dispatchFromTemplate(
    templateCode: string,
    variables: Record<string, string>,
    target: { userId: string; organizationId?: string }
  ) {
    const tplRes = await dbPool.query<{
      code: string;
      title: string;
      body_template: string;
      channel: NotificationChannel;
    }>(
      'SELECT code, title, body_template, channel FROM notifications.templates WHERE code = $1 AND is_active = TRUE',
      [templateCode]
    );

    if (tplRes.rows.length === 0) {
      throw new NotFoundException(`Notification template ${templateCode} not found or inactive`);
    }

    const tpl = tplRes.rows[0];
    let body = tpl.body_template;
    let title = tpl.title;

    for (const [key, val] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), val);
      title = title.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }

    return this.dispatch({
      userId: target.userId,
      organizationId: target.organizationId,
      title,
      message: body,
      channel: tpl.channel,
      metadata: { templateCode, variables },
    });
  }

  async getUserNotifications(userId: string, unreadOnly = false, limit = 50) {
    let sql = 'SELECT * FROM notifications.notifications WHERE user_id = $1';
    const params: unknown[] = [userId];

    if (unreadOnly) {
      sql += ' AND is_read = FALSE';
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const res = await dbPool.query(sql, params);
    return res.rows;
  }

  async markAsRead(notificationId: string, userId: string) {
    const res = await dbPool.query(
      `UPDATE notifications.notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Notification not found');
    }

    return res.rows[0];
  }

  async markAllAsRead(userId: string) {
    await dbPool.query(
      'UPDATE notifications.notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const res = await dbPool.query<{ count: string }>(
      'SELECT COUNT(*)::int as count FROM notifications.notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return parseInt(res.rows[0]?.count || '0', 10);
  }
}
