import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { StorageService } from '../../storage/storage.service';

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diupload pada field "file"');
    }

    const data = await this.storageService.saveImage(file);

    return {
      success: true,
      message: 'Gambar berhasil diupload',
      data,
    };
  }
}
