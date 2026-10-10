import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { createHash, randomUUID } from 'crypto';

import * as midtransClient from 'midtrans-client';

import { PrismaService } from '../prisma/prisma.service';

import { MidtransWebhookDto } from './dto/midtrans-webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * ============================================================
   * CREATE SNAP PAYMENT
   * ============================================================
   *
   * Membuat sesi pembayaran Midtrans Snap
   * untuk sebuah order.
   */
  async createSnapPayment(orderNumber: string) {
    /**
     * ----------------------------------------------------------
     * 1. Cari order
     * ----------------------------------------------------------
     */
    const order = await this.prisma.order.findUnique({
      where: {
        orderNumber,
      },

      include: {
        customer: true,

        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    /**
     * ----------------------------------------------------------
     * 2. Pastikan order masih PENDING
     * ----------------------------------------------------------
     */
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Order tidak dapat dibayar karena statusnya ${order.status}`,
      );
    }

    /**
     * ----------------------------------------------------------
     * 3. Pastikan order memiliki item
     * ----------------------------------------------------------
     */
    if (!order.items.length) {
      throw new BadRequestException(
        'Order tidak memiliki item yang dapat dibayar',
      );
    }

    /**
     * ----------------------------------------------------------
     * 4. Validasi total pembayaran
     * ----------------------------------------------------------
     */
    const grossAmount = Number(order.totalAmount);

    if (!Number.isSafeInteger(grossAmount) || grossAmount <= 0) {
      throw new BadRequestException('Total pembayaran order tidak valid');
    }

    /**
     * ----------------------------------------------------------
     * 5. Ambil konfigurasi Midtrans
     * ----------------------------------------------------------
     */
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');

    const isProduction =
      this.configService.get<string>('MIDTRANS_IS_PRODUCTION') === 'true';

    const clientKey =
      this.configService.get<string>('MIDTRANS_CLIENT_KEY') ?? '';

    if (!serverKey) {
      throw new InternalServerErrorException(
        'MIDTRANS_SERVER_KEY belum dikonfigurasi',
      );
    }

    /**
     * ----------------------------------------------------------
     * 6. Cek apakah Snap sebelumnya sudah dibuat
     * ----------------------------------------------------------
     *
     * Jika sudah ada payment PENDING dengan Snap Token,
     * gunakan kembali token tersebut.
     */
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,

        provider: 'MIDTRANS',

        snapToken: {
          not: null,
        },

        transactionStatus: 'PENDING',
      },

      orderBy: {
        id: 'desc',
      },
    });

    if (existingPayment?.snapToken) {
      return {
        orderNumber: order.orderNumber,
        paymentId: existingPayment.id,
        snapToken: existingPayment.snapToken,
        redirectUrl: existingPayment.redirectUrl,
      };
    }

    /**
     * ----------------------------------------------------------
     * 7. Buat instance Midtrans Snap
     * ----------------------------------------------------------
     */
    const snap = new midtransClient.Snap({
      isProduction,

      serverKey,

      clientKey,
    });

    /**
     * ----------------------------------------------------------
     * 8. Buat item details
     * ----------------------------------------------------------
     */
    const itemDetails = order.items.map((item) => ({
      id: String(item.productId),

      price: Number(item.unitPrice),

      quantity: item.quantity,

      name: item.productTitle,
    }));

    /**
     * ----------------------------------------------------------
     * 9. Parameter transaksi Midtrans
     * ----------------------------------------------------------
     */
    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,

        gross_amount: grossAmount,
      },

      customer_details: {
        first_name: order.customer.name,

        email: order.customer.email,

        phone: order.customer.whatsapp ?? undefined,
      },

      item_details: itemDetails,

      credit_card: {
        secure: true,
      },
    };

    /**
     * ----------------------------------------------------------
     * 10. Create transaction
     * ----------------------------------------------------------
     */
    const transaction = await snap.createTransaction(parameter);

    const snapToken = transaction.token;

    const redirectUrl = transaction.redirect_url;

    if (!snapToken) {
      throw new InternalServerErrorException(
        'Midtrans tidak mengembalikan Snap token',
      );
    }

    /**
     * ----------------------------------------------------------
     * 11. Simpan Payment
     * ----------------------------------------------------------
     */
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,

        provider: 'MIDTRANS',

        orderIdProvider: order.orderNumber,

        grossAmount,

        transactionStatus: 'PENDING',

        snapToken,

        redirectUrl,

        rawResponse: JSON.stringify(transaction),
      },
    });

    /**
     * ----------------------------------------------------------
     * 12. Return
     * ----------------------------------------------------------
     */
    return {
      orderNumber: order.orderNumber,

      paymentId: payment.id,

      snapToken,

      redirectUrl,
    };
  }

  /**
   * ============================================================
   * HANDLE MIDTRANS WEBHOOK
   * ============================================================
   *
   * Fokus:
   *
   * 1. Validasi signature
   * 2. Validasi gross amount
   * 3. Simpan PaymentNotification
   * 4. Idempotent terhadap duplicate webhook
   * 5. Update Payment
   * 6. Update Order
   * 7. Membuat ProductAccess
   * 8. Membuat EmailNotification
   */
  async handleWebhook(payload: MidtransWebhookDto) {
    /**
     * ----------------------------------------------------------
     * 1. Ambil Server Key
     * ----------------------------------------------------------
     */
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');

    if (!serverKey) {
      throw new InternalServerErrorException(
        'MIDTRANS_SERVER_KEY belum dikonfigurasi',
      );
    }

    /**
     * ----------------------------------------------------------
     * 2. Validasi field dasar
     * ----------------------------------------------------------
     */
    if (
      !payload.order_id ||
      !payload.status_code ||
      !payload.gross_amount ||
      !payload.signature_key ||
      !payload.transaction_status
    ) {
      throw new BadRequestException('Payload webhook Midtrans tidak lengkap');
    }

    /**
     * ----------------------------------------------------------
     * 3. Validasi signature Midtrans
     * ----------------------------------------------------------
     *
     * SHA512(
     *   order_id +
     *   status_code +
     *   gross_amount +
     *   serverKey
     * )
     */
    const signatureInput =
      payload.order_id + payload.status_code + payload.gross_amount + serverKey;

    const expectedSignature = createHash('sha512')
      .update(signatureInput)
      .digest('hex');

    const signatureValid =
      expectedSignature.toLowerCase() === payload.signature_key.toLowerCase();

    /**
     * Payload asli disimpan untuk audit.
     */
    const rawPayload = JSON.stringify(payload);

    /**
     * ----------------------------------------------------------
     * 4. Buat notification key
     * ----------------------------------------------------------
     *
     * Digunakan untuk mendeteksi duplicate webhook.
     */
    const notificationKey = createHash('sha256')
      .update(
        [
          payload.order_id,
          payload.transaction_id ?? '',
          payload.transaction_status,
          payload.status_code,
          payload.gross_amount,
        ].join('|'),
      )
      .digest('hex');

    /**
     * ----------------------------------------------------------
     * 5. Signature tidak valid
     * ----------------------------------------------------------
     *
     * Tetap simpan notification untuk audit,
     * tetapi jangan memproses pembayaran.
     */
    if (!signatureValid) {
      await this.prisma.paymentNotification.upsert({
        where: {
          notificationKey,
        },

        create: {
          provider: 'MIDTRANS',

          notificationKey,

          transactionId: payload.transaction_id,

          orderIdProvider: payload.order_id,

          statusCode: payload.status_code,

          transactionStatus: payload.transaction_status,

          fraudStatus: payload.fraud_status,

          signatureValid: false,

          payload: rawPayload,
        },

        update: {
          signatureValid: false,

          payload: rawPayload,
        },
      });

      throw new BadRequestException('Signature webhook Midtrans tidak valid');
    }

    /**
     * ----------------------------------------------------------
     * 6. Cari order
     * ----------------------------------------------------------
     *
     * PERBAIKAN PENTING:
     *
     * customer: true
     *
     * diperlukan untuk membuat EmailNotification.
     */
    const order = await this.prisma.order.findUnique({
      where: {
        orderNumber: payload.order_id,
      },

      include: {
        customer: true,

        items: true,
      },
    });

    if (!order) {
      /**
       * Notification valid tetapi order tidak dikenal.
       * Tetap simpan untuk audit.
       */
      await this.prisma.paymentNotification.upsert({
        where: {
          notificationKey,
        },

        create: {
          provider: 'MIDTRANS',

          notificationKey,

          transactionId: payload.transaction_id,

          orderIdProvider: payload.order_id,

          statusCode: payload.status_code,

          transactionStatus: payload.transaction_status,

          fraudStatus: payload.fraud_status,

          signatureValid: true,

          payload: rawPayload,
        },

        update: {
          signatureValid: true,

          payload: rawPayload,
        },
      });

      throw new NotFoundException(
        'Order berdasarkan order_id Midtrans tidak ditemukan',
      );
    }

    /**
     * ----------------------------------------------------------
     * 7. Validasi gross amount
     * ----------------------------------------------------------
     */
    const orderGrossAmount = Number(order.totalAmount);

    const webhookGrossAmount = Number(payload.gross_amount);

    if (
      !Number.isSafeInteger(orderGrossAmount) ||
      !Number.isSafeInteger(webhookGrossAmount) ||
      orderGrossAmount !== webhookGrossAmount
    ) {
      await this.prisma.paymentNotification.upsert({
        where: {
          notificationKey,
        },

        create: {
          provider: 'MIDTRANS',

          notificationKey,

          transactionId: payload.transaction_id,

          orderIdProvider: payload.order_id,

          statusCode: payload.status_code,

          transactionStatus: payload.transaction_status,

          fraudStatus: payload.fraud_status,

          signatureValid: true,

          payload: rawPayload,
        },

        update: {
          signatureValid: true,

          payload: rawPayload,
        },
      });

      throw new BadRequestException(
        'Gross amount webhook tidak sesuai dengan total order',
      );
    }

    /**
     * ----------------------------------------------------------
     * 8. Cek duplicate notification
     * ----------------------------------------------------------
     */
    const existingNotification =
      await this.prisma.paymentNotification.findUnique({
        where: {
          notificationKey,
        },
      });

    if (existingNotification?.processedAt) {
      return {
        alreadyProcessed: true,

        notificationId: existingNotification.id,

        paymentId: existingNotification.paymentId,

        orderNumber: order.orderNumber,

        paymentStatus: this.mapTransactionStatus(payload.transaction_status),

        orderStatus: order.status,
      };
    }

    /**
     * ----------------------------------------------------------
     * 9. Tentukan PaymentStatus
     * ----------------------------------------------------------
     */
    const paymentStatus = this.mapTransactionStatus(payload.transaction_status);

    /**
     * ----------------------------------------------------------
     * 10. Tentukan PaymentType
     * ----------------------------------------------------------
     */
    const paymentType = this.mapPaymentType(payload.payment_type);

    /**
     * ----------------------------------------------------------
     * 11. Cari Payment Midtrans
     * ----------------------------------------------------------
     */
    let payment = await this.prisma.payment.findFirst({
      where: {
        orderId: order.id,

        provider: 'MIDTRANS',
      },

      orderBy: {
        id: 'desc',
      },
    });

    /**
     * ----------------------------------------------------------
     * 12. Transaction database
     * ----------------------------------------------------------
     */
    const result = await this.prisma.$transaction(async (tx) => {
      /**
       * ====================================================
       * A. CREATE / UPDATE PAYMENT
       * ====================================================
       */
      if (!payment) {
        payment = await tx.payment.create({
          data: {
            orderId: order.id,

            provider: 'MIDTRANS',

            transactionId: payload.transaction_id,

            orderIdProvider: payload.order_id,

            paymentType,

            transactionStatus: paymentStatus,

            grossAmount: webhookGrossAmount,

            transactionTime: this.parseDate(payload.transaction_time),

            settlementTime: this.parseDate(payload.settlement_time),

            fraudStatus: payload.fraud_status,

            signatureKeyVerified: true,

            rawResponse: rawPayload,
          },
        });
      } else {
        payment = await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            transactionId: payload.transaction_id ?? payment.transactionId,

            orderIdProvider: payload.order_id,

            paymentType,

            transactionStatus: paymentStatus,

            grossAmount: webhookGrossAmount,

            transactionTime: this.parseDate(payload.transaction_time),

            settlementTime: this.parseDate(payload.settlement_time),

            fraudStatus: payload.fraud_status,

            signatureKeyVerified: true,

            rawResponse: rawPayload,
          },
        });
      }

      /**
       * ====================================================
       * B. UPDATE ORDER
       * ====================================================
       */
      let newOrderStatus = order.status;

      /**
       * ----------------------------------------------------
       * SETTLEMENT / CAPTURE
       * ----------------------------------------------------
       */
      if (
        payload.transaction_status === 'settlement' ||
        payload.transaction_status === 'capture'
      ) {
        /**
         * Jangan menurunkan order yang
         * sudah PAID.
         */
        if (order.status !== 'PAID') {
          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              status: 'PAID',

              paidAt: order.paidAt ?? new Date(),
            },
          });
        }

        newOrderStatus = 'PAID';

        /**
         * ==================================================
         * C. BUAT PRODUCT ACCESS
         * ==================================================
         *
         * Satu order + satu product
         * hanya boleh memiliki satu access.
         */
        for (const item of order.items) {
          const existingAccess = await tx.productAccess.findUnique({
            where: {
              orderId_productId: {
                orderId: order.id,

                productId: item.productId,
              },
            },
          });

          /**
           * Belum punya access.
           */
          if (!existingAccess) {
            await tx.productAccess.create({
              data: {
                orderId: order.id,

                productId: item.productId,

                accessToken: randomUUID(),

                status: 'ACTIVE',
              },
            });
          }

          /**
           * Jika sebelumnya REVOKED,
           * aktifkan kembali.
           */
          else if (existingAccess.status === 'REVOKED') {
            await tx.productAccess.update({
              where: {
                id: existingAccess.id,
              },

              data: {
                status: 'ACTIVE',

                expiresAt: null,
              },
            });
          }
        }

        /**
         * ==================================================
         * D. BUAT EMAIL NOTIFICATION
         * ==================================================
         *
         * Email tidak dikirim langsung di webhook.
         *
         * Kita hanya membuat record PENDING.
         *
         * EmailService nantinya mengambil
         * notification PENDING dan mengirimnya.
         *
         * Idempotent:
         * jika webhook settlement dikirim ulang,
         * notification yang sama tidak dibuat dua kali.
         */
        await this.createEmailNotification(
          tx,

          order.id,

          order.customer.email,

          order.orderNumber,
        );
      }

      /**
       * ----------------------------------------------------
       * EXPIRE
       * ----------------------------------------------------
       */
      else if (payload.transaction_status === 'expire') {
        /**
         * Jangan mengubah PAID menjadi EXPIRED.
         */
        if (order.status !== 'PAID') {
          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              status: 'EXPIRED',
            },
          });

          newOrderStatus = 'EXPIRED';
        }
      }

      /**
       * ----------------------------------------------------
       * CANCEL
       * ----------------------------------------------------
       */
      else if (payload.transaction_status === 'cancel') {
        /**
         * Jangan mengubah PAID menjadi CANCELLED.
         */
        if (order.status !== 'PAID') {
          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              status: 'CANCELLED',
            },
          });

          newOrderStatus = 'CANCELLED';
        }
      }

      /**
       * ----------------------------------------------------
       * DENY / FAILURE
       * ----------------------------------------------------
       */
      else if (
        payload.transaction_status === 'deny' ||
        payload.transaction_status === 'failure'
      ) {
        /**
         * Jangan mengubah PAID menjadi FAILED.
         */
        if (order.status !== 'PAID') {
          await tx.order.update({
            where: {
              id: order.id,
            },

            data: {
              status: 'FAILED',
            },
          });

          newOrderStatus = 'FAILED';
        }
      }

      /**
       * ====================================================
       * E. SIMPAN PAYMENT NOTIFICATION
       * ====================================================
       */
      let notification;

      if (existingNotification) {
        notification = await tx.paymentNotification.update({
          where: {
            id: existingNotification.id,
          },

          data: {
            paymentId: payment!.id,

            provider: 'MIDTRANS',

            transactionId: payload.transaction_id,

            orderIdProvider: payload.order_id,

            statusCode: payload.status_code,

            transactionStatus: payload.transaction_status,

            fraudStatus: payload.fraud_status,

            signatureValid: true,

            payload: rawPayload,

            processedAt: new Date(),
          },
        });
      } else {
        notification = await tx.paymentNotification.create({
          data: {
            paymentId: payment!.id,

            provider: 'MIDTRANS',

            notificationKey,

            transactionId: payload.transaction_id,

            orderIdProvider: payload.order_id,

            statusCode: payload.status_code,

            transactionStatus: payload.transaction_status,

            fraudStatus: payload.fraud_status,

            signatureValid: true,

            payload: rawPayload,

            processedAt: new Date(),
          },
        });
      }

      /**
       * Return hasil transaction.
       */
      return {
        payment,

        notification,

        orderStatus: newOrderStatus,
      };
    });

    /**
     * ========================================================
     * RETURN
     * ========================================================
     */
    return {
      alreadyProcessed: false,

      notificationId: result.notification.id,

      paymentId: result.payment.id,

      orderNumber: order.orderNumber,

      paymentStatus,

      orderStatus: result.orderStatus,
    };
  }

  /**
   * ============================================================
   * CREATE EMAIL NOTIFICATION
   * ============================================================
   *
   * Membuat EmailNotification PENDING secara idempotent.
   *
   * Fungsi ini hanya membuat antrean email.
   *
   * Pengiriman email dilakukan oleh EmailService.
   */
  private async createEmailNotification(
    tx: any,
    orderId: number,
    recipient: string,
    orderNumber: string,
  ) {
    /**
     * Subject email.
     */
    const subject = `Pembelian berhasil - ${orderNumber}`;

    /**
     * Cek apakah notification sudah ada.
     */
    const existing = await tx.emailNotification.findFirst({
      where: {
        orderId,

        recipient,

        subject,
      },
    });

    /**
     * Jika sudah ada,
     * jangan membuat duplicate.
     */
    if (existing) {
      return existing;
    }

    /**
     * Buat notification baru.
     */
    return tx.emailNotification.create({
      data: {
        orderId,

        recipient,

        subject,

        status: 'PENDING',

        attempts: 0,
      },
    });
  }

  /**
   * ============================================================
   * MAP TRANSACTION STATUS
   * ============================================================
   */
  private mapTransactionStatus(
    status?: string,
  ):
    | 'PENDING'
    | 'SETTLEMENT'
    | 'CAPTURE'
    | 'EXPIRE'
    | 'CANCEL'
    | 'DENY'
    | 'FAILURE'
    | 'REFUND' {
    switch (status) {
      case 'settlement':
        return 'SETTLEMENT';

      case 'capture':
        return 'CAPTURE';

      case 'expire':
        return 'EXPIRE';

      case 'cancel':
        return 'CANCEL';

      case 'deny':
        return 'DENY';

      case 'failure':
        return 'FAILURE';

      case 'refund':
        return 'REFUND';

      case 'pending':
      default:
        return 'PENDING';
    }
  }

  /**
   * ============================================================
   * MAP PAYMENT TYPE
   * ============================================================
   */
  private mapPaymentType(
    paymentType?: string,
  ):
    | 'QRIS'
    | 'BANK_TRANSFER'
    | 'VIRTUAL_ACCOUNT'
    | 'E_WALLET'
    | 'CREDIT_CARD'
    | 'OTHER'
    | null {
    if (!paymentType) {
      return null;
    }

    switch (paymentType) {
      case 'qris':
        return 'QRIS';

      case 'bank_transfer':
        return 'BANK_TRANSFER';

      case 'echannel':
      case 'bca_va':
      case 'bni_va':
      case 'bri_va':
      case 'permata_va':
      case 'other_va':
        return 'VIRTUAL_ACCOUNT';

      case 'gopay':
      case 'shopeepay':
      case 'dana':
      case 'ovo':
        return 'E_WALLET';

      case 'credit_card':
        return 'CREDIT_CARD';

      default:
        return 'OTHER';
    }
  }

  /**
   * ============================================================
   * PARSE DATE
   * ============================================================
   */
  private parseDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }
}
