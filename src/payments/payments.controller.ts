import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';

import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * ============================================================
   * MIDTRANS WEBHOOK
   * ============================================================
   *
   * POST /api/payments/webhook
   *
   * Endpoint ini TIDAK menggunakan checkout token.
   *
   * Keamanan dilakukan melalui:
   *
   * 1. signature_key
   * 2. gross_amount
   * 3. notification idempotency
   */
  @Post('webhook')
  async webhook(@Body() payload: MidtransWebhookDto) {
    const data = await this.paymentsService.handleWebhook(payload);

    return {
      success: true,
      message: 'Webhook Midtrans berhasil diproses',
      data,
    };
  }

  /**
   * ============================================================
   * GET ORDER STATUS
   * ============================================================
   *
   * GET /api/payments/orders/:orderNumber
   *
   * Header:
   *
   * X-Checkout-Token: <checkout-token>
   */
  @Get('orders/:orderNumber')
  async getOrderStatus(
    @Param('orderNumber') orderNumber: string,
    @Headers('x-checkout-token') checkoutToken?: string,
  ) {
    const data = await this.paymentsService.getOrderStatus(
      orderNumber,
      checkoutToken,
    );

    return {
      success: true,
      message: 'Status order berhasil diambil',
      data,
    };
  }

  /**
   * ============================================================
   * CREATE SNAP PAYMENT
   * ============================================================
   *
   * POST /api/payments/:orderNumber/snap
   *
   * Header:
   *
   * X-Checkout-Token: <checkout-token>
   */
  @Post(':orderNumber/snap')
  async createSnapPayment(
    @Param('orderNumber') orderNumber: string,
    @Headers('x-checkout-token') checkoutToken?: string,
  ) {
    const data = await this.paymentsService.createSnapPayment(
      orderNumber,
      checkoutToken,
    );

    return {
      success: true,
      message: 'Sesi pembayaran berhasil dibuat',
      data,
    };
  }
}
