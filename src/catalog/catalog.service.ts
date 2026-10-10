import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil seluruh program studi
   * beserta mata kuliah dan produk aktif.
   */
  async getStudyPrograms() {
    return this.prisma.studyProgram.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        name: 'asc',
      },

      include: {
        courses: {
          where: {
            isActive: true,
          },

          orderBy: {
            code: 'asc',
          },

          include: {
            products: {
              where: {
                status: 'ACTIVE',
              },

              orderBy: {
                title: 'asc',
              },

              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                price: true,
                thumbnail: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mengambil detail satu program studi.
   */
  async getStudyProgramById(id: number) {
    return this.prisma.studyProgram.findFirst({
      where: {
        id,
        isActive: true,
      },

      include: {
        courses: {
          where: {
            isActive: true,
          },

          orderBy: {
            code: 'asc',
          },

          include: {
            products: {
              where: {
                status: 'ACTIVE',
              },

              orderBy: {
                title: 'asc',
              },

              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                price: true,
                thumbnail: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mengambil seluruh mata kuliah aktif.
   */
  async getCourses(programId?: number) {
    return this.prisma.course.findMany({
      where: {
        isActive: true,

        ...(programId
          ? {
              studyProgramId: programId,
            }
          : {}),
      },

      orderBy: {
        code: 'asc',
      },

      include: {
        studyProgram: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        products: {
          where: {
            status: 'ACTIVE',
          },

          orderBy: {
            title: 'asc',
          },

          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            price: true,
            thumbnail: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Mengambil detail mata kuliah berdasarkan ID.
   */
  async getCourseById(id: number) {
    return this.prisma.course.findFirst({
      where: {
        id,
        isActive: true,
      },

      include: {
        studyProgram: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },

        products: {
          where: {
            status: 'ACTIVE',
          },

          orderBy: {
            title: 'asc',
          },

          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            price: true,
            thumbnail: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Mengambil seluruh produk aktif.
   */
  async getProducts() {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,

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

  /**
   * Mengambil produk berdasarkan slug.
   */
  async getProductBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
      },

      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,

            studyProgram: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },

        productFiles: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    });
  }
}
