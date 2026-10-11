import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            orders: true,
          },
        },

        orders: {
          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            orderNumber: true,
            subtotal: true,
            discountAmount: true,
            totalAmount: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return customer;
  }
}
