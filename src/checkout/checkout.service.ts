import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CheckoutTokenService } from './checkout-token.service';

import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutTokenService: CheckoutTokenService,
  ) {}

  async create(dto: CreateCheckoutDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Keranjang tidak memiliki produk yang dapat dibeli',
      );
    }

    /**
     * Jangan izinkan product yang sama dikirim
     * lebih dari sekali dalam satu checkout.
     */
    const productIds = dto.items.map((item) => item.productId);

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException(
        'Produk yang sama tidak boleh muncul lebih dari satu kali',
      );
    }

    /**
     * Ambil seluruh produk dari database.
     *
     * Harga tetap diambil dari database,
     * bukan dari frontend.
     */
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    /**
     * Pastikan semua productId benar-benar ada.
     */
    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((product) => product.id));

      const missingProductIds = productIds.filter((id) => !foundIds.has(id));

      throw new NotFoundException(
        `Produk tidak ditemukan: ${missingProductIds.join(', ')}`,
      );
    }

    /**
     * Validasi seluruh produk dan hitung subtotal
     * berdasarkan harga database.
     */
    const orderItems = dto.items.map((item) => {
      const product = products.find((product) => product.id === item.productId);

      if (!product) {
        throw new NotFoundException(`Produk ${item.productId} tidak ditemukan`);
      }

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Produk "${product.title}" tidak tersedia untuk dibeli`,
        );
      }

      if (item.quantity < 1) {
        throw new BadRequestException(
          `Jumlah produk "${product.title}" minimal 1`,
        );
      }

      const unitPrice = Number(product.price);

      if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
        throw new BadRequestException(
          `Harga produk "${product.title}" belum ditetapkan dengan benar`,
        );
      }

      const subtotal = unitPrice * item.quantity;

      if (!Number.isSafeInteger(subtotal)) {
        throw new BadRequestException(
          `Subtotal produk "${product.title}" tidak valid`,
        );
      }

      return {
        productId: product.id,
        productTitle: product.title,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal,
      };
    });

    /**
     * Total seluruh produk.
     */
    const subtotal = orderItems.reduce(
      (total, item) => total + item.subtotal,
      0,
    );

    if (!Number.isSafeInteger(subtotal) || subtotal <= 0) {
      throw new BadRequestException('Total harga order tidak valid');
    }

    const totalAmount = subtotal;

    const orderNumber = await this.generateOrderNumber();

    /**
     * Transaction:
     *
     * Customer
     * +
     * Order
     * +
     * seluruh OrderItem
     */
    const result = await this.prisma.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: {
          email: dto.email,
        },
      });

      if (customer) {
        customer = await tx.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            name: dto.name,
            whatsapp: dto.whatsapp,
          },
        });
      } else {
        customer = await tx.customer.create({
          data: {
            name: dto.name,
            email: dto.email,
            whatsapp: dto.whatsapp,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          subtotal,
          discountAmount: 0,
          totalAmount,
          status: 'PENDING',

          items: {
            create: orderItems,
          },
        },

        include: {
          customer: true,
          items: true,
        },
      });

      return order;
    });

    /**
     * Buat token untuk mengakses order.
     */
    const checkoutToken = this.checkoutTokenService.issue(result.orderNumber);

    return {
      ...result,
      checkoutToken,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const now = new Date();

      const date = now
        .toISOString()
        .replace(/[-:TZ.]/g, '')
        .slice(0, 14);

      const random = Math.floor(1000 + Math.random() * 9000);

      const orderNumber = `ORD-${date}-${random}`;

      const existing = await this.prisma.order.findUnique({
        where: {
          orderNumber,
        },
      });

      if (!existing) {
        return orderNumber;
      }
    }

    throw new Error('Gagal membuat nomor order unik');
  }
}
