import { Body, Controller, Param, Post } from '@nestjs/common';

import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * ============================================================
   * MIDTRANS WEBHOOK / NOTIFICATION
   * ============================================================
   *
   * Endpoint:
   *
   * POST /api/payments/webhook
   *
   * Endpoint ini TIDAK menggunakan JWT/AuthGuard.
   *
   * Midtrans akan mengirim HTTP Notification ke endpoint ini.
   *
   * Keamanan webhook dilakukan di PaymentsService melalui:
   *
   * 1. Validasi field payload
   * 2. Validasi signature_key
   * 3. Validasi gross_amount
   * 4. Idempotency notification
   *
   * Jangan menambahkan:
   *
   * @UseGuards(JwtAuthGuard)
   *
   * pada endpoint ini.
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
   * CREATE MIDTRANS SNAP PAYMENT
   * ============================================================
   *
   * Endpoint:
   *
   * POST /api/payments/:orderNumber/snap
   *
   * Contoh:
   *
   * POST /api/payments/ORD-20261010180238-6086/snap
   *
   * Endpoint ini digunakan frontend untuk meminta
   * Snap Token dari backend.
   */
  @Post(':orderNumber/snap')
  async createSnapPayment(
    @Param('orderNumber')
    orderNumber: string,
  ) {
    const data = await this.paymentsService.createSnapPayment(orderNumber);

    return {
      success: true,

      message: 'Sesi pembayaran berhasil dibuat',

      data,
    };
  }
}
