import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Membuat transporter SMTP.
   *
   * Konfigurasi:
   * SMTP_HOST
   * SMTP_PORT
   * SMTP_USER
   * SMTP_PASSWORD
   * SMTP_ENCRYPTION
   */
  private getTransporter(): nodemailer.Transporter {
    /**
     * Gunakan transporter yang sudah dibuat
     * jika sebelumnya sudah tersedia.
     */
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');

    const port = Number(this.configService.get<string>('SMTP_PORT') ?? 587);

    const user = this.configService.get<string>('SMTP_USER');

    const password = this.configService.get<string>('SMTP_PASSWORD');

    const encryption =
      this.configService.get<string>('SMTP_ENCRYPTION') ?? 'tls';

    if (!host) {
      throw new InternalServerErrorException('SMTP_HOST belum dikonfigurasi');
    }

    if (!user) {
      throw new InternalServerErrorException('SMTP_USER belum dikonfigurasi');
    }

    if (!password) {
      throw new InternalServerErrorException(
        'SMTP_PASSWORD belum dikonfigurasi',
      );
    }

    /**
     * Gmail:
     *
     * Port 587 + TLS/STARTTLS
     * menggunakan secure: false.
     *
     * Port 465 menggunakan secure: true.
     */
    const secure = encryption.toLowerCase() === 'ssl' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,

      auth: {
        user,
        pass: password,
      },

      requireTLS: encryption.toLowerCase() === 'tls',
    });

    return this.transporter;
  }

  /**
   * Menguji koneksi SMTP.
   *
   * Endpoint ini berguna untuk testing
   * konfigurasi Gmail SMTP.
   */
  async testConnection() {
    const transporter = this.getTransporter();

    await transporter.verify();

    return {
      success: true,
      message: 'Koneksi SMTP berhasil',
    };
  }

  /**
   * Mengirim seluruh EmailNotification
   * yang masih berstatus PENDING.
   *
   * Maksimal 10 email per proses.
   */
  async sendPendingEmails() {
    const notifications = await this.prisma.emailNotification.findMany({
      where: {
        status: 'PENDING',
      },

      orderBy: {
        id: 'asc',
      },

      take: 10,
    });

    const results: Array<{
      id: number;
      success: boolean;
      result?: unknown;
      error?: string;
    }> = [];

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification.id);

        results.push({
          id: notification.id,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          id: notification.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      total: notifications.length,
      results,
    };
  }

  /**
   * Mengirim satu EmailNotification.
   */
  async sendNotification(notificationId: number) {
    const notification = await this.prisma.emailNotification.findUnique({
      where: {
        id: notificationId,
      },

      include: {
        order: {
          include: {
            customer: true,

            items: {
              include: {
                product: true,
              },
            },

            /**
             * Ambil ProductAccess aktif
             * beserta product dan semua file-nya.
             */
            productAccesses: {
              where: {
                status: 'ACTIVE',
              },

              include: {
                product: {
                  include: {
                    productFiles: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Email notification tidak ditemukan');
    }

    /**
     * Jangan mengirim ulang email
     * yang sudah berhasil dikirim.
     */
    if (notification.status === 'SENT') {
      return {
        id: notification.id,
        status: 'SENT',
        message: 'Email sudah pernah dikirim',
      };
    }

    /**
     * Tandai PROCESSING.
     */
    await this.prisma.emailNotification.update({
      where: {
        id: notification.id,
      },

      data: {
        status: 'PROCESSING',

        attempts: {
          increment: 1,
        },
      },
    });

    try {
      const order = notification.order;

      if (!order) {
        throw new Error('Order tidak ditemukan untuk email notification');
      }

      if (!order.customer) {
        throw new Error('Customer tidak ditemukan untuk order');
      }

      if (!order.customer.email) {
        throw new Error('Email customer tidak tersedia');
      }

      /**
       * Ambil transporter SMTP.
       */
      const transporter = this.getTransporter();

      /**
       * Email pengirim.
       */
      const fromAddress =
        this.configService.get<string>('SMTP_FROM_ADDRESS') ??
        this.configService.get<string>('SMTP_USER');

      const fromName =
        this.configService.get<string>('SMTP_FROM') ?? 'TunasBimbel';

      const appName =
        this.configService.get<string>('APP_NAME') ?? 'TunasBimbel';

      /**
       * Membuat data produk.
       */
      const productRows = this.buildProductRows(
        order.productAccesses,
        order.items,
      );

      /**
       * Membuat link download.
       *
       * Sekarang link menggunakan:
       *
       * /api/download/:accessToken/:fileId
       */
      const downloadLinks = this.buildDownloadLinks(order.productAccesses);

      /**
       * Prisma Decimal -> number.
       */
      const totalAmount = Number(order.totalAmount);

      /**
       * Membuat HTML email.
       */
      const html = this.buildHtmlEmail({
        appName,

        customerName: order.customer.name,

        orderNumber: order.orderNumber,

        totalAmount,

        productRows,

        downloadLinks,
      });

      /**
       * Membuat plain text email.
       */
      const text = this.buildTextEmail({
        appName,

        customerName: order.customer.name,

        orderNumber: order.orderNumber,

        totalAmount,

        productRows,

        downloadLinks,
      });

      /**
       * Kirim email.
       */
      const mailResult = await transporter.sendMail({
        from: {
          name: fromName,
          address: fromAddress,
        },

        to: order.customer.email,

        subject:
          notification.subject ?? `Pembelian berhasil - ${order.orderNumber}`,

        text,

        html,
      });

      /**
       * Jika berhasil:
       *
       * PROCESSING -> SENT
       */
      await this.prisma.emailNotification.update({
        where: {
          id: notification.id,
        },

        data: {
          status: 'SENT',

          sentAt: new Date(),

          lastError: null,
        },
      });

      this.logger.log(
        `Email berhasil dikirim: notification=${notification.id}, order=${order.orderNumber}, messageId=${mailResult.messageId}`,
      );

      return {
        id: notification.id,

        status: 'SENT',

        message: 'Email berhasil dikirim',

        messageId: mailResult.messageId,

        recipient: order.customer.email,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown email error';

      /**
       * Jika gagal:
       *
       * PROCESSING -> PENDING
       *
       * sehingga scheduler dapat
       * mencoba lagi.
       */
      await this.prisma.emailNotification.update({
        where: {
          id: notification.id,
        },

        data: {
          status: 'PENDING',

          lastError: errorMessage,
        },
      });

      this.logger.error(
        `Gagal mengirim email notification ${notification.id}: ${errorMessage}`,
      );

      throw error;
    }
  }

  /**
   * Membuat data produk untuk email.
   */
  private buildProductRows(productAccesses: any[], orderItems: any[]) {
    const accessProductIds = new Set<number>(
      productAccesses.map((access) => access.productId),
    );

    return orderItems.map((item) => ({
      title: item.productTitle ?? item.product?.title ?? 'Produk',

      quantity: item.quantity,

      /**
       * Prisma Decimal -> number.
       */
      unitPrice: Number(item.unitPrice),

      /**
       * Prisma Decimal -> number.
       */
      subtotal: Number(item.subtotal),

      hasAccess: accessProductIds.has(item.productId),
    }));
  }

  /**
   * Membuat link download untuk
   * setiap ProductFile.
   *
   * Format:
   *
   * /api/download/:accessToken/:fileId
   */
  private buildDownloadLinks(productAccesses: any[]) {
    const downloadBaseUrl =
      this.configService.get<string>('DOWNLOAD_BASE_URL') ??
      this.configService.get<string>('APP_URL') ??
      'http://localhost:3000';

    const baseUrl = downloadBaseUrl.replace(/\/$/, '');

    return productAccesses.flatMap((access) => {
      const files = access.product?.productFiles ?? [];

      return files.map((file: any) => ({
        productTitle: access.product?.title ?? 'Produk',

        fileName: file.fileName ?? 'Materi',

        fileId: file.id,

        url:
          `${baseUrl}/api/download/` + `${access.accessToken}/` + `${file.id}`,
      }));
    });
  }

  /**
   * Format angka menjadi Rupiah.
   */
  private formatRupiah(value: number | string): string {
    const amount = Number(value);

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',

      currency: 'IDR',

      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Escape HTML.
   */
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * HTML email.
   */
  private buildHtmlEmail(data: {
    appName: string;

    customerName: string;

    orderNumber: string;

    totalAmount: number | string;

    productRows: any[];

    downloadLinks: {
      productTitle: string;

      fileName: string;

      fileId: number;

      url: string;
    }[];
  }): string {
    /**
     * Tabel produk.
     */
    const productRowsHtml = data.productRows
      .map(
        (item) => `
            <tr>
              <td style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              ">
                ${this.escapeHtml(item.title)}
              </td>

              <td style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
                text-align:center;
              ">
                ${item.quantity}
              </td>

              <td style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
                text-align:right;
              ">
                ${this.formatRupiah(item.subtotal)}
              </td>
            </tr>
          `,
      )
      .join('');

    /**
     * Link download.
     */
    const downloadLinksHtml =
      data.downloadLinks.length > 0
        ? data.downloadLinks
            .map(
              (item) => `
                <div style="
                  margin-bottom:15px;
                  padding:15px;
                  border:1px solid #e5e7eb;
                  border-radius:8px;
                ">

                  <div style="
                    margin-bottom:8px;
                    font-weight:bold;
                    color:#111827;
                  ">
                    ${this.escapeHtml(item.productTitle)}
                  </div>

                  <div style="
                    margin-bottom:12px;
                    font-size:13px;
                    color:#6b7280;
                  ">
                    ${this.escapeHtml(item.fileName)}
                  </div>

                  <a
                    href="${item.url}"
                    style="
                      display:inline-block;
                      padding:10px 16px;
                      background:#2563eb;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:6px;
                    "
                  >
                    Download Materi
                  </a>

                </div>
              `,
            )
            .join('')
        : `
            <p>
              Link download belum tersedia.
              Silakan hubungi administrator.
            </p>
          `;

    return `
<!DOCTYPE html>

<html lang="id">

<head>
  <meta charset="UTF-8">

  <title>
    Pembelian Berhasil
  </title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f4f6;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    max-width:650px;
    margin:30px auto;
    background:#ffffff;
    border-radius:10px;
    overflow:hidden;
  ">

    <!-- HEADER -->

    <div style="
      padding:24px;
      background:#111827;
      color:#ffffff;
    ">

      <h1 style="
        margin:0;
        font-size:24px;
      ">
        ${this.escapeHtml(data.appName)}
      </h1>

    </div>

    <!-- CONTENT -->

    <div style="
      padding:30px;
    ">

      <h2 style="
        margin-top:0;
        color:#111827;
      ">
        Pembelian Berhasil
      </h2>

      <p>
        Halo
        <strong>
          ${this.escapeHtml(data.customerName)}
        </strong>,
      </p>

      <p>
        Pembayaran Anda telah
        berhasil dikonfirmasi.
      </p>

      <!-- ORDER INFORMATION -->

      <div style="
        background:#f9fafb;
        padding:16px;
        border-radius:8px;
        margin:20px 0;
      ">

        <p style="
          margin:5px 0;
        ">
          <strong>
            Nomor Pesanan:
          </strong>

          ${this.escapeHtml(data.orderNumber)}
        </p>

        <p style="
          margin:5px 0;
        ">
          <strong>
            Total:
          </strong>

          ${this.formatRupiah(data.totalAmount)}
        </p>

      </div>

      <!-- PRODUCTS -->

      <h3>
        Produk yang Dibeli
      </h3>

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          border-collapse:collapse;
          margin-bottom:25px;
        "
      >

        <thead>

          <tr>

            <th style="
              padding:10px;
              background:#f3f4f6;
              text-align:left;
            ">
              Produk
            </th>

            <th style="
              padding:10px;
              background:#f3f4f6;
              text-align:center;
            ">
              Qty
            </th>

            <th style="
              padding:10px;
              background:#f3f4f6;
              text-align:right;
            ">
              Subtotal
            </th>

          </tr>

        </thead>

        <tbody>

          ${productRowsHtml}

        </tbody>

      </table>

      <!-- DOWNLOAD -->

      <h3>
        Download Materi
      </h3>

      <p>
        Berikut adalah materi yang
        tersedia untuk pesanan Anda.
      </p>

      ${downloadLinksHtml}

      <!-- SECURITY NOTICE -->

      <p style="
        margin-top:30px;
        font-size:13px;
        color:#6b7280;
      ">

        Jangan membagikan link download
        kepada orang lain.

        Link tersebut merupakan akses
        pribadi untuk pembelian Anda.

      </p>

    </div>

    <!-- FOOTER -->

    <div style="
      padding:20px 30px;
      background:#f9fafb;
      color:#6b7280;
      font-size:12px;
      text-align:center;
    ">

      Email ini dikirim secara otomatis.

      <br>

      Mohon tidak membalas email ini.

    </div>

  </div>

</body>

</html>
    `;
  }

  /**
   * Plain text email.
   *
   * Digunakan sebagai fallback
   * untuk email client yang tidak
   * mendukung HTML.
   */
  private buildTextEmail(data: {
    appName: string;

    customerName: string;

    orderNumber: string;

    totalAmount: number | string;

    productRows: any[];

    downloadLinks: {
      productTitle: string;

      fileName: string;

      fileId: number;

      url: string;
    }[];
  }): string {
    /**
     * Daftar produk.
     */
    const products = data.productRows
      .map(
        (item) =>
          `- ${item.title} x${item.quantity} = ${this.formatRupiah(
            item.subtotal,
          )}`,
      )
      .join('\n');

    /**
     * Daftar link download.
     */
    const links =
      data.downloadLinks.length > 0
        ? data.downloadLinks
            .map(
              (item) =>
                `- ${item.productTitle} - ${item.fileName}: ${item.url}`,
            )
            .join('\n')
        : 'Link download belum tersedia.';

    return `
${data.appName}

PEMBELIAN BERHASIL

Halo ${data.customerName},

Pembayaran Anda telah berhasil dikonfirmasi.

Nomor Pesanan:
${data.orderNumber}

Total:
${this.formatRupiah(data.totalAmount)}

Produk yang Dibeli:
${products}

Link Download:
${links}

Jangan membagikan link download kepada orang lain.
Link tersebut merupakan akses pribadi untuk pembelian Anda.

Email ini dikirim secara otomatis.
Mohon tidak membalas email ini.
    `.trim();
  }
}
