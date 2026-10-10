import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';

import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('programs')
  async getStudyPrograms() {
    return {
      success: true,
      data: await this.catalogService.getStudyPrograms(),
    };
  }

  @Get('programs/:id')
  async getStudyProgramById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.catalogService.getStudyProgramById(id);

    if (!data) {
      return {
        success: false,
        message: 'Study program not found',
      };
    }

    return {
      success: true,
      data,
    };
  }

  @Get('courses')
  async getCourses(@Query('programId') programId?: string) {
    return {
      success: true,
      data: await this.catalogService.getCourses(
        programId ? Number(programId) : undefined,
      ),
    };
  }

  @Get('courses/:id')
  async getCourseById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.catalogService.getCourseById(id);

    if (!data) {
      return {
        success: false,
        message: 'Course not found',
      };
    }

    return {
      success: true,
      data,
    };
  }

  @Get('products')
  async getProducts() {
    return {
      success: true,
      data: await this.catalogService.getProducts(),
    };
  }

  @Get('products/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    const data = await this.catalogService.getProductBySlug(slug);

    if (!data) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    return {
      success: true,
      data,
    };
  }
}
