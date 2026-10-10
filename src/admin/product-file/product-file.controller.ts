import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { ProductFileService } from './product-file.service';

import { CreateProductFileDto } from './dto/create-product-file.dto';
import { UpdateProductFileDto } from './dto/update-product-file.dto';

@Controller('admin/product-files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ProductFileController {
  constructor(private readonly productFileService: ProductFileService) {}

  /**
   * GET /api/admin/product-files
   *
   * Mengambil semua file produk.
   */
  @Get()
  async findAll() {
    return {
      success: true,
      message: 'Daftar file produk berhasil diambil',
      data: await this.productFileService.findAll(),
    };
  }

  /**
   * GET /api/admin/product-files/:id
   *
   * Mengambil detail file produk.
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return {
      success: true,
      message: 'Detail file produk berhasil diambil',
      data: await this.productFileService.findOne(id),
    };
  }

  /**
   * POST /api/admin/product-files/upload
   *
   * Upload file PDF ke private storage.
   *
   * Content-Type:
   * multipart/form-data
   *
   * Field:
   * productId
   * file
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @Body('productId', ParseIntPipe)
    productId: number,

    @UploadedFile()
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    return {
      success: true,
      message: 'File produk berhasil diupload',
      data: await this.productFileService.upload(productId, file),
    };
  }

  /**
   * POST /api/admin/product-files
   *
   * Membuat metadata ProductFile secara manual.
   */
  @Post()
  async create(
    @Body()
    dto: CreateProductFileDto,
  ) {
    return {
      success: true,
      message: 'File produk berhasil dibuat',
      data: await this.productFileService.create(dto),
    };
  }

  /**
   * PATCH /api/admin/product-files/:id
   *
   * Memperbarui metadata ProductFile.
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateProductFileDto,
  ) {
    return {
      success: true,
      message: 'File produk berhasil diperbarui',
      data: await this.productFileService.update(id, dto),
    };
  }

  /**
   * DELETE /api/admin/product-files/:id
   *
   * Menghapus ProductFile.
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return {
      success: true,
      message: 'File produk berhasil dihapus',
      data: await this.productFileService.remove(id),
    };
  }
}
