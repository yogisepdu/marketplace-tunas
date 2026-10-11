import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            credits: true,
            studyProgram: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            productFiles: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            credits: true,
            studyProgram: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            productFiles: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const course = await this.prisma.course.findUnique({
      where: {
        id: dto.courseId,
      },
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    const existingSlug = await this.prisma.product.findUnique({
      where: {
        slug: dto.slug,
      },
    });

    if (existingSlug) {
      throw new ConflictException('Slug produk sudah digunakan');
    }

    return this.prisma.product.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        slug: dto.slug,
        description: dto.description ?? null,
        price: dto.price ?? 0,
        thumbnail: dto.thumbnail ?? null,
        status: dto.status ?? 'DRAFT',
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            credits: true,
            studyProgram: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    /*
     * Jika courseId diubah, pastikan mata kuliah
     * tujuan memang ada.
     */
    if (dto.courseId !== undefined) {
      const course = await this.prisma.course.findUnique({
        where: {
          id: dto.courseId,
        },
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }
    }

    /*
     * Pastikan slug tidak bentrok dengan produk lain.
     */
    if (dto.slug !== undefined && dto.slug !== existing.slug) {
      const duplicate = await this.prisma.product.findUnique({
        where: {
          slug: dto.slug,
        },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('Slug produk sudah digunakan');
      }
    }

    /*
     * Susun data update.
     *
     * courseId tidak langsung dikirim sebagai
     * field scalar agar kompatibel dengan Prisma
     * relation yang digunakan generated client.
     */
    const data: any = {
      ...(dto.title !== undefined && {
        title: dto.title,
      }),

      ...(dto.slug !== undefined && {
        slug: dto.slug,
      }),

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.price !== undefined && {
        price: dto.price,
      }),

      ...(dto.thumbnail !== undefined && {
        thumbnail: dto.thumbnail,
      }),

      ...(dto.status !== undefined && {
        status: dto.status,
      }),
    };

    /*
     * Hubungkan produk ke mata kuliah baru
     * menggunakan relation Prisma.
     */
    if (dto.courseId !== undefined) {
      data.course = {
        connect: {
          id: dto.courseId,
        },
      };
    }

    return this.prisma.product.update({
      where: {
        id,
      },
      data,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            semester: true,
            credits: true,
            studyProgram: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    await this.prisma.product.delete({
      where: {
        id,
      },
    });

    return {
      id,
      deleted: true,
    };
  }
}
