import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateProductFileDto } from './dto/create-product-file.dto';
import { UpdateProductFileDto } from './dto/update-product-file.dto';

@Injectable()
export class ProductFileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Mengambil semua ProductFile.
   */
  async findAll() {
    return this.prisma.productFile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
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
        },
      },
    });
  }

  /**
   * Mengambil detail ProductFile berdasarkan ID.
   */
  async findOne(id: number) {
    const productFile = await this.prisma.productFile.findUnique({
      where: {
        id,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
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
        },
      },
    });

    if (!productFile) {
      throw new NotFoundException('File produk tidak ditemukan');
    }

    return productFile;
  }

  /**
   * Membuat metadata ProductFile secara manual.
   *
   * Catatan:
   * Method ini masih dipertahankan untuk CRUD metadata.
   * Untuk upload file sebenarnya gunakan method upload().
   */
  async create(dto: CreateProductFileDto) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: dto.productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    return this.prisma.productFile.create({
      data: {
        productId: dto.productId,
        fileName: dto.fileName,
        filePath: dto.filePath,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
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
    });
  }

  /**
   * Upload file produk ke private storage.
   *
   * File hanya diperbolehkan:
   * - PDF
   * - maksimal 20 MB
   *
   * Nama file fisik dibuat menggunakan UUID.
   */
  async upload(
    productId: number,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    /**
     * 1. Pastikan produk tersedia.
     */
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Produk tidak ditemukan');
    }

    /**
     * 2. Pastikan file dikirim.
     */
    if (!file) {
      throw new BadRequestException('File wajib diupload');
    }

    /**
     * 3. Validasi MIME type.
     */
    const allowedMimeTypes = ['application/pdf'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Hanya file PDF yang diperbolehkan');
    }

    /**
     * 4. Validasi ukuran file.
     *
     * Maksimal 20 MB.
     */
    const maxFileSize = 20 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new BadRequestException('Ukuran file maksimal 20 MB');
    }

    /**
     * 5. Validasi ekstensi file.
     */
    const originalExtension = path.extname(file.originalname).toLowerCase();

    if (originalExtension !== '.pdf') {
      throw new BadRequestException('File harus memiliki ekstensi .pdf');
    }

    /**
     * 6. Tentukan root private storage.
     *
     * Nilai berasal dari .env:
     *
     * PRIVATE_STORAGE_PATH="./storage"
     */
    const storageRoot =
      this.configService.get<string>('PRIVATE_STORAGE_PATH') ?? './storage';

    /**
     * 7. Tentukan folder berdasarkan Product.
     *
     * Contoh:
     *
     * storage/
     * └── products/
     *     └── 1/
     */
    const productDirectory = path.join(
      storageRoot,
      'products',
      String(productId),
    );

    /**
     * 8. Buat folder jika belum tersedia.
     */
    await fs.mkdir(productDirectory, {
      recursive: true,
    });

    /**
     * 9. Generate nama file random.
     *
     * Contoh:
     *
     * 550e8400-e29b-41d4-a716-446655440000.pdf
     */
    const storedFileName = `${randomUUID()}.pdf`;

    /**
     * 10. Path fisik file.
     */
    const absolutePath = path.join(productDirectory, storedFileName);

    /**
     * 11. Simpan file ke private storage.
     */
    await fs.writeFile(absolutePath, file.buffer);

    /**
     * 12. Path relatif yang disimpan
     *     ke database.
     *
     * Contoh:
     *
     * products/1/uuid.pdf
     */
    const relativePath = path
      .join('products', String(productId), storedFileName)
      .replace(/\\/g, '/');

    try {
      /**
       * 13. Simpan metadata file ke database.
       */
      const productFile = await this.prisma.productFile.create({
        data: {
          productId,
          fileName: file.originalname,
          filePath: relativePath,
          fileSize: file.size,
          mimeType: file.mimetype,
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
      });

      return productFile;
    } catch (error) {
      /**
       * 14. Jika database gagal menyimpan,
       *     hapus file fisik agar tidak
       *     meninggalkan file yatim.
       */
      await fs.rm(absolutePath, {
        force: true,
      });

      throw error;
    }
  }

  /**
   * Memperbarui metadata ProductFile.
   */
  async update(id: number, dto: UpdateProductFileDto) {
    const existing = await this.prisma.productFile.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('File produk tidak ditemukan');
    }

    /**
     * Jika productId diubah,
     * pastikan produk tujuan tersedia.
     */
    if (dto.productId !== undefined) {
      const product = await this.prisma.product.findUnique({
        where: {
          id: dto.productId,
        },
      });

      if (!product) {
        throw new NotFoundException('Produk tidak ditemukan');
      }
    }

    return this.prisma.productFile.update({
      where: {
        id,
      },
      data: {
        ...(dto.productId !== undefined && {
          productId: dto.productId,
        }),

        ...(dto.fileName !== undefined && {
          fileName: dto.fileName,
        }),

        ...(dto.filePath !== undefined && {
          filePath: dto.filePath,
        }),

        ...(dto.fileSize !== undefined && {
          fileSize: dto.fileSize,
        }),

        ...(dto.mimeType !== undefined && {
          mimeType: dto.mimeType,
        }),
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
    });
  }

  /**
   * Menghapus ProductFile.
   *
   * Catatan:
   * Saat ini method ini menghapus metadata
   * dari database. Penghapusan file fisik
   * akan kita sempurnakan bersama pada tahap
   * berikutnya agar storage tetap konsisten.
   */
  async remove(id: number) {
    const existing = await this.prisma.productFile.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('File produk tidak ditemukan');
    }

    const storageRoot =
      this.configService.get<string>('PRIVATE_STORAGE_PATH') ?? './storage';

    const absolutePath = path.join(storageRoot, existing.filePath);

    // Hapus record database terlebih dahulu.
    await this.prisma.productFile.delete({
      where: { id },
    });

    // Setelah database berhasil dihapus,
    // hapus file fisik jika memang ada.
    try {
      await fs.rm(absolutePath, {
        force: true,
      });
    } catch (error) {
      console.error('Gagal menghapus file fisik:', error);
    }

    return {
      id,
      deleted: true,
      fileDeleted: true,
    };
  }
}
