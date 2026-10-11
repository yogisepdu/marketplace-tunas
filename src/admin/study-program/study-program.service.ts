import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';

@Injectable()
export class StudyProgramService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const studyPrograms = await this.prisma.studyProgram.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    return studyPrograms;
  }

  async findOne(id: number) {
    const studyProgram = await this.prisma.studyProgram.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!studyProgram) {
      throw new NotFoundException('Program studi tidak ditemukan');
    }

    return studyProgram;
  }

  async create(dto: CreateStudyProgramDto) {
    const existingCode = await this.prisma.studyProgram.findUnique({
      where: {
        code: dto.code,
      },
    });

    if (existingCode) {
      throw new ConflictException('Kode program studi sudah digunakan');
    }

    const studyProgram = await this.prisma.studyProgram.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        image: dto.image,
      },
    });

    return studyProgram;
  }

  async update(id: number, dto: UpdateStudyProgramDto) {
    const existing = await this.prisma.studyProgram.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Program studi tidak ditemukan');
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.prisma.studyProgram.findUnique({
        where: {
          code: dto.code,
        },
      });

      if (duplicate) {
        throw new ConflictException('Kode program studi sudah digunakan');
      }
    }

    return this.prisma.studyProgram.update({
      where: {
        id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.code !== undefined && {
          code: dto.code,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.image !== undefined && {
          image: dto.image,
        }),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.studyProgram.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Program studi tidak ditemukan');
    }

    await this.prisma.studyProgram.delete({
      where: {
        id,
      },
    });

    return {
      id,
      deleted: true,
    };
  }
}
