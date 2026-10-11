import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        customer: true,

        items: {
          orderBy: {
            id: 'asc',
          },

          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        items: {
          orderBy: {
            id: 'asc',
          },

          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    return order;
  }

  async updateStatus(id: number, status: string) {
    const allowedStatuses = [
      'PENDING',
      'PAID',
      'EXPIRED',
      'CANCELLED',
      'FAILED',
      'REFUNDED',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Status pesanan tidak valid. Gunakan: ${allowedStatuses.join(', ')}`,
      );
    }

    const existing = await this.prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Pesanan tidak ditemukan');
    }

    const data: {
      status:
        'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED' | 'REFUNDED';
      paidAt?: Date | null;
    } = {
      status: status as
        'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED' | 'REFUNDED',
    };

    if (status === 'PAID') {
      data.paidAt = existing.paidAt ?? new Date();
    }

    if (status !== 'PAID' && existing.status === 'PAID') {
      data.paidAt = null;
    }

    return this.prisma.order.update({
      where: {
        id,
      },

      data,

      include: {
        customer: true,

        items: {
          orderBy: {
            id: 'asc',
          },

          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });
  }
}
