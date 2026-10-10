import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCheckoutDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Produk tidak tersedia untuk dibeli');
    }

    const unitPrice = Number(product.price);

    if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
      throw new BadRequestException(
        'Harga produk belum ditetapkan dengan benar',
      );
    }

    if (dto.quantity < 1) {
      throw new BadRequestException('Jumlah produk minimal 1');
    }

    const subtotal = unitPrice * dto.quantity;

    if (!Number.isSafeInteger(subtotal)) {
      throw new BadRequestException('Total harga tidak valid');
    }

    const totalAmount = subtotal;

    const orderNumber = await this.generateOrderNumber();

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
            create: {
              productId: product.id,
              productTitle: product.title,
              unitPrice: product.price,
              quantity: dto.quantity,
              subtotal,
            },
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return order;
    });

    return result;
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
