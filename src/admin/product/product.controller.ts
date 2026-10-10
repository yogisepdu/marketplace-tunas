import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@Controller('api/admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll() {
    return {
      success: true,
      message: 'Daftar produk berhasil diambil',
      data: await this.productService.findAll(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Detail produk berhasil diambil',
      data: await this.productService.findOne(id),
    };
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return {
      success: true,
      message: 'Produk berhasil dibuat',
      data: await this.productService.create(dto),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return {
      success: true,
      message: 'Produk berhasil diperbarui',
      data: await this.productService.update(id, dto),
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Produk berhasil dihapus',
      data: await this.productService.remove(id),
    };
  }
}
