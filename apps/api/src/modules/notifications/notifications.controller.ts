import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService, DispatchNotificationDto } from './notifications.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(
    @Query('unreadOnly') unreadOnly: string,
    @Query('limit') limit: string,
    @CurrentUser() user: UserContext
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      unreadOnly === 'true',
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: UserContext) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: UserContext
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: UserContext) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('dispatch')
  async dispatch(
    @Body() body: DispatchNotificationDto,
    @CurrentUser() user: UserContext
  ) {
    return this.notificationsService.dispatch({
      ...body,
      organizationId: body.organizationId || user.activeOrganizationId || undefined,
    });
  }
}
