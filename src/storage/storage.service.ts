import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

@Injectable()
export class StorageService {
  private readonly publicImageDir: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configuredPath =
      this.configService.get<string>('PUBLIC_STORAGE_PATH') ??
      './storage/public/images';

    this.publicImageDir = resolve(process.cwd(), configuredPath);
    this.appUrl = (
      this.configService.get<string>('APP_URL') ?? 'http://localhost:3000/'
    ).replace(/\/$/, '');
  }

  async saveImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diupload');
    }

    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Ukuran gambar maksimal 5 MB');
    }

    await mkdir(this.publicImageDir, { recursive: true });

    const extension =
      this.extensionFromMimeType(file.mimetype) ??
      extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const absolutePath = join(this.publicImageDir, filename);

    const { writeFile } = await import('node:fs/promises');
    await writeFile(absolutePath, file.buffer);

    return {
      filename,
      path: `images/${filename}`,
      url: `${this.appUrl}/api/media/images/${filename}`,
    };
  }

  async deleteImageByUrl(url: string | null | undefined) {
    if (!url) return;

    const marker = '/api/media/images/';
    const index = url.indexOf(marker);
    if (index === -1) return;

    const filename = decodeURIComponent(url.slice(index + marker.length));
    if (
      !filename ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('..')
    ) {
      return;
    }

    try {
      await unlink(join(this.publicImageDir, filename));
    } catch (error: any) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  getPublicImagePath(filename: string) {
    if (
      !filename ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('..')
    ) {
      throw new BadRequestException('Nama file tidak valid');
    }

    return join(this.publicImageDir, filename);
  }

  createReadStream(filename: string) {
    return createReadStream(this.getPublicImagePath(filename));
  }

  private extensionFromMimeType(mimetype: string) {
    switch (mimetype) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      default:
        return null;
    }
  }
}
