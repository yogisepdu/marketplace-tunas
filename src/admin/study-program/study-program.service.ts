import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';

@Injectable()
export class StudyProgramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll() {
    return this.prisma.studyProgram.findMany({
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
    // Hanya cek duplikasi kode jika kode benar-benar ada.
    if (dto.code) {
      const existingCode = await this.prisma.studyProgram.findUnique({
        where: {
          code: dto.code,
        },
      });

      if (existingCode) {
        throw new ConflictException('Kode program studi sudah digunakan');
      }
    }

    const studyProgram = await this.prisma.studyProgram.create({
      data: {
        name: dto.name,
        code: dto.code ?? undefined,
        description: dto.description ?? undefined,
        image: dto.image ?? undefined,
        isActive: dto.isActive ?? true,
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

    // Cek kode hanya jika kode baru memiliki nilai.
    if (
      dto.code !== undefined &&
      dto.code !== null &&
      dto.code !== '' &&
      dto.code !== existing.code
    ) {
      const duplicate = await this.prisma.studyProgram.findUnique({
        where: {
          code: dto.code,
        },
      });

      if (duplicate) {
        throw new ConflictException('Kode program studi sudah digunakan');
      }
    }

    // Jika gambar diganti, hapus gambar lama.
    if (
      dto.image !== undefined &&
      dto.image !== null &&
      dto.image !== existing.image &&
      existing.image
    ) {
      await this.storageService.deleteImageByUrl(existing.image);
    }

    return this.prisma.studyProgram.update({
      where: {
        id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.code !== undefined &&
          dto.code !== null && {
            code: dto.code,
          }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.image !== undefined && {
          image: dto.image,
        }),

        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
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

    // Hapus file gambar dari storage jika ada.
    if (existing.image) {
      await this.storageService.deleteImageByUrl(existing.image);
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
