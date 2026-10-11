import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      orderBy: [
        {
          semester: 'asc',
        },
        {
          code: 'asc',
        },
      ],
      include: {
        studyProgram: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: {
        id,
      },
      include: {
        studyProgram: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    return course;
  }

  async create(dto: CreateCourseDto) {
    const studyProgram = await this.prisma.studyProgram.findUnique({
      where: {
        id: dto.studyProgramId,
      },
    });

    if (!studyProgram) {
      throw new NotFoundException('Program studi tidak ditemukan');
    }

    const existingCode = await this.prisma.course.findUnique({
      where: {
        studyProgramId_code: {
          studyProgramId: dto.studyProgramId,
          code: dto.code,
        },
      },
    });

    if (existingCode) {
      throw new ConflictException('Kode mata kuliah sudah digunakan');
    }

    return this.prisma.course.create({
      data: {
        code: dto.code,
        name: dto.name,
        semester: dto.semester,
        credits: dto.credits,
        studyProgramId: dto.studyProgramId,
        image: dto.image,
      },
      include: {
        studyProgram: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateCourseDto) {
    const existing = await this.prisma.course.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    if (dto.code && dto.code !== existing.code) {
      const targetStudyProgramId =
        dto.studyProgramId ?? existing.studyProgramId;

      const duplicate = await this.prisma.course.findUnique({
        where: {
          studyProgramId_code: {
            studyProgramId: targetStudyProgramId,
            code: dto.code,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'Kode mata kuliah sudah digunakan pada program studi tersebut',
        );
      }
    }

    if (
      dto.studyProgramId !== undefined &&
      dto.studyProgramId !== existing.studyProgramId
    ) {
      const studyProgram = await this.prisma.studyProgram.findUnique({
        where: {
          id: dto.studyProgramId,
        },
      });

      if (!studyProgram) {
        throw new NotFoundException('Program studi tidak ditemukan');
      }
    }

    return this.prisma.course.update({
      where: {
        id,
      },
      data: {
        ...(dto.code !== undefined && {
          code: dto.code,
        }),

        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.semester !== undefined && {
          semester: dto.semester,
        }),

        ...(dto.credits !== undefined && {
          credits: dto.credits,
        }),

        ...(dto.studyProgramId !== undefined && {
          studyProgramId: dto.studyProgramId,
        }),

        ...(dto.image !== undefined && {
          image: dto.image,
        }),
      },
      include: {
        studyProgram: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.course.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    await this.prisma.course.delete({
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
