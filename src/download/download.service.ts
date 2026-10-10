import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DownloadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getFile(accessToken: string, fileId: number) {
    const access = await this.prisma.productAccess.findUnique({
      where: {
        accessToken,
      },
      include: {
        product: {
          include: {
            productFiles: true,
          },
        },
      },
    });

    if (!access) {
      throw new NotFoundException('Akses download tidak ditemukan');
    }

    if (access.status !== 'ACTIVE') {
      throw new ForbiddenException('Akses download sudah tidak aktif');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      throw new ForbiddenException('Akses download sudah kedaluwarsa');
    }

    const file = access.product.productFiles.find((item) => item.id === fileId);

    if (!file) {
      throw new ForbiddenException(
        'File tidak termasuk dalam produk yang Anda beli',
      );
    }

    const storageRoot = path.resolve(
      this.configService.get<string>('PRIVATE_STORAGE_PATH') ?? './storage',
    );

    /**
     * file.filePath disimpan sebagai path relatif
     * terhadap folder storage.
     *
     * Contoh:
     * products/1/uuid.pdf
     *
     * Jika database menyimpan:
     * storage/products/1/uuid.pdf
     *
     * prefix "storage/" akan dibuang.
     */
    const relativePath = file.filePath.replace(/^storage[\\/]/, '');

    const absolutePath = path.resolve(storageRoot, relativePath);

    /**
     * Mencegah path traversal.
     *
     * File hanya boleh berada
     * di dalam PRIVATE_STORAGE_PATH.
     */
    if (!absolutePath.startsWith(storageRoot + path.sep)) {
      throw new ForbiddenException('Path file tidak valid');
    }

    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException('File fisik tidak ditemukan');
    }

    return {
      absolutePath,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileId: file.id,
      productId: access.productId,
      accessId: access.id,
    };
  }

  async logDownload(
    productAccessId: number,
    fileId: number,
    status: 'SUCCESS' | 'FAILED',
    ipAddress?: string,
    userAgent?: string,
  ) {
    /**
     * DownloadLog pada schema menggunakan:
     *
     * productAccessId
     *
     * BUKAN accessId.
     *
     * Saat ini DownloadLog tidak mempunyai fileId,
     * sehingga fileId tidak disimpan ke tabel.
     */
    return this.prisma.downloadLog.create({
      data: {
        productAccessId,
        fileId,
        status,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  }
}
