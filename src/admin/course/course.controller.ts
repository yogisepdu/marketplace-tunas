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

import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async findAll() {
    const data = await this.courseService.findAll();

    return {
      success: true,
      message: 'Data mata kuliah berhasil diambil',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.courseService.findOne(id);

    return {
      success: true,
      message: 'Detail mata kuliah berhasil diambil',
      data,
    };
  }

  @Post()
  async create(@Body() dto: CreateCourseDto) {
    const data = await this.courseService.create(dto);

    return {
      success: true,
      message: 'Mata kuliah berhasil dibuat',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
  ) {
    const data = await this.courseService.update(id, dto);

    return {
      success: true,
      message: 'Mata kuliah berhasil diperbarui',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.courseService.remove(id);

    return {
      success: true,
      message: 'Mata kuliah berhasil dihapus',
      data,
    };
  }
}
