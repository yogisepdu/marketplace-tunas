import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { existsSync } from 'node:fs';

import { StorageService } from './storage.service';

@Controller('media/images')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':filename')
  getImage(@Param('filename') filename: string) {
    const path = this.storageService.getPublicImagePath(filename);

    if (!existsSync(path)) {
      throw new NotFoundException('Gambar tidak ditemukan');
    }

    const stream = this.storageService.createReadStream(filename);
    return new StreamableFile(stream);
  }
}
