import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      success: true,
      message: 'Marketplace Tunas API is running',
    };
  }

  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        success: true,
        message: 'Database connection is working',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
      };
    }
  }

  async getDatabaseTables() {
    try {
      const [studyPrograms, courses, products, customers, orders] =
        await Promise.all([
          this.prisma.studyProgram.count(),
          this.prisma.course.count(),
          this.prisma.product.count(),
          this.prisma.customer.count(),
          this.prisma.order.count(),
        ]);

      return {
        success: true,
        message: 'Prisma Client is working',
        data: {
          studyPrograms,
          courses,
          products,
          customers,
          orders,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Prisma Client query failed',
      };
    }
  }
}
