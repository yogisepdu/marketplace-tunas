import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
    // Pastikan program studi tersedia.
    const studyProgram = await this.prisma.studyProgram.findUnique({
      where: {
        id: dto.studyProgramId,
      },
    });

    if (!studyProgram) {
      throw new NotFoundException('Program studi tidak ditemukan');
    }

    // Cek kode mata kuliah agar tidak duplikat
    // pada program studi yang sama.
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

    const course = await this.prisma.course.create({
      data: {
        code: dto.code,
        name: dto.name,

        semester: dto.semester ?? null,
        credits: dto.credits ?? null,

        studyProgramId: dto.studyProgramId,

        image: dto.image ?? null,

        // Default aktif jika tidak dikirim.
        isActive: dto.isActive ?? true,
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

    return course;
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

    /*
     * ============================================================
     * CEK KODE MATA KULIAH
     * ============================================================
     */
    if (dto.code !== undefined && dto.code !== existing.code) {
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

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          'Kode mata kuliah sudah digunakan pada program studi tersebut',
        );
      }
    }

    /*
     * ============================================================
     * CEK PROGRAM STUDI
     * ============================================================
     */
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

    /*
     * ============================================================
     * HAPUS GAMBAR LAMA JIKA DIGANTI
     * ============================================================
     */
    if (
      dto.image !== undefined &&
      dto.image !== existing.image &&
      existing.image
    ) {
      await this.storageService.deleteImageByUrl(existing.image);
    }

    /*
     * ============================================================
     * UPDATE DATA
     * ============================================================
     */
    const course = await this.prisma.course.update({
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

        /*
         * INI YANG MEMBUAT CHECKBOX
         * "Mata kuliah aktif" BENAR-BENAR BERFUNGSI.
         */
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
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

    return course;
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

    /*
     * Hapus gambar dari storage sebelum menghapus
     * record mata kuliah.
     */
    if (existing.image) {
      await this.storageService.deleteImageByUrl(existing.image);
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
