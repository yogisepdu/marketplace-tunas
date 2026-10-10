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

import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';
import { StudyProgramService } from './study-program.service';

@Controller('api/admin/study-programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StudyProgramController {
  constructor(private readonly studyProgramService: StudyProgramService) {}

  @Get()
  async findAll() {
    const data = await this.studyProgramService.findAll();

    return {
      success: true,
      message: 'Data program studi berhasil diambil',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.studyProgramService.findOne(id);

    return {
      success: true,
      message: 'Detail program studi berhasil diambil',
      data,
    };
  }

  @Post()
  async create(@Body() dto: CreateStudyProgramDto) {
    const data = await this.studyProgramService.create(dto);

    return {
      success: true,
      message: 'Program studi berhasil dibuat',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudyProgramDto,
  ) {
    const data = await this.studyProgramService.update(id, dto);

    return {
      success: true,
      message: 'Program studi berhasil diperbarui',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.studyProgramService.remove(id);

    return {
      success: true,
      message: 'Program studi berhasil dihapus',
      data,
    };
  }
}
