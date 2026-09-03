import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { PaymentsService, CreatePaymentIntentDto } from './payments.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { TenantGuard } from '../../common/tenant/tenant.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { UserContext } from '@platform/types';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async createIntent(
    @Body() body: Omit<CreatePaymentIntentDto, 'organizationId'>,
    @CurrentUser() user: UserContext
  ) {
    return this.paymentsService.createPaymentIntent(
      {
        ...body,
        organizationId: user.activeOrganizationId!,
      },
      user.id
    );
  }

  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-signature') signature?: string
  ) {
    return this.paymentsService.handleGatewayWebhook({
      provider,
      referenceNumber: payload.referenceNumber || payload.ref,
      status: payload.status === 'SUCCESS' || payload.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
      amount: payload.amount,
      currency: payload.currency || 'ETB',
      transactionId: payload.transactionId || payload.tx_id || `TX-${Date.now()}`,
      metadata: { signature, rawPayload: payload },
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  async listPayments(
    @Query('invoiceId') invoiceId?: string,
    @CurrentUser() user?: UserContext
  ) {
    return this.paymentsService.listPayments(user!.activeOrganizationId!, invoiceId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }
}
