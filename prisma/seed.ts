import 'dotenv/config';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'marketplace_tunas',
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Memulai seed data...');

  // =====================================================
  // STUDY PROGRAM
  // =====================================================

  const studyProgram = await prisma.studyProgram.upsert({
    where: {
      code: 'S1-SI',
    },
    update: {
      name: 'S1 Sistem Informasi',
      isActive: true,
    },
    create: {
      name: 'S1 Sistem Informasi',
      code: 'S1-SI',
      isActive: true,
    },
  });

  console.log(`✓ Study Program: ${studyProgram.name}`);

  // =====================================================
  // COURSE
  // =====================================================

  const courses = [
    {
      code: 'STSI4208',
      name: 'Analisis dan Perancangan Sistem',
    },
    {
      code: 'STSI4207',
      name: 'Sistem Informasi Manajemen',
    },
    {
      code: 'STSI4206',
      name: 'Proses Bisnis',
    },
  ];

  // =====================================================
  // PRODUCTS
  // =====================================================

  const productDefinitions = [
    {
      courseCode: 'STSI4208',
      products: [
        {
          title: 'Modul Ringkasan Materi',
          slug: 'stsi4208-modul-ringkasan-materi',
        },
        {
          title: 'Latihan Soal',
          slug: 'stsi4208-latihan-soal',
        },
        {
          title: 'Paket Persiapan Ujian',
          slug: 'stsi4208-paket-persiapan-ujian',
        },
        {
          title: 'Paket Lengkap',
          slug: 'stsi4208-paket-lengkap',
        },
      ],
    },

    {
      courseCode: 'STSI4207',
      products: [
        {
          title: 'Ringkasan Materi',
          slug: 'stsi4207-ringkasan-materi',
        },
        {
          title: 'Latihan Soal',
          slug: 'stsi4207-latihan-soal',
        },
        {
          title: 'Paket Lengkap',
          slug: 'stsi4207-paket-lengkap',
        },
      ],
    },

    {
      courseCode: 'STSI4206',
      products: [
        {
          title: 'Ringkasan Materi',
          slug: 'stsi4206-ringkasan-materi',
        },
        {
          title: 'Paket Latihan',
          slug: 'stsi4206-paket-latihan',
        },
      ],
    },
  ];

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: {
        studyProgramId_code: {
          studyProgramId: studyProgram.id,
          code: courseData.code,
        },
      },
      update: {
        name: courseData.name,
        isActive: true,
      },
      create: {
        studyProgramId: studyProgram.id,
        code: courseData.code,
        name: courseData.name,
        isActive: true,
      },
    });

    console.log(`✓ Course: ${course.code} - ${course.name}`);

    const definition = productDefinitions.find(
      (item) => item.courseCode === course.code,
    );

    if (!definition) {
      continue;
    }

    for (const productData of definition.products) {
      const product = await prisma.product.upsert({
        where: {
          slug: productData.slug,
        },
        update: {
          title: productData.title,
          courseId: course.id,
          status: 'ACTIVE',
        },
        create: {
          courseId: course.id,
          title: productData.title,
          slug: productData.slug,
          description: `Produk pembelajaran ${productData.title} untuk ${course.code} - ${course.name}.`,
          price: 0,
          status: 'ACTIVE',
        },
      });

      console.log(`  ✓ Product: ${product.title}`);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('🌱 Seed data berhasil!');
  console.log('========================================');

  // =====================================================
  // SUMMARY
  // =====================================================

  const studyProgramCount = await prisma.studyProgram.count();

  const courseCount = await prisma.course.count();

  const productCount = await prisma.product.count();

  console.log(`Study Programs : ${studyProgramCount}`);

  console.log(`Courses        : ${courseCount}`);

  console.log(`Products       : ${productCount}`);

  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.adminUser.upsert({
    where: {
      email: 'admin@marketplace-tunas.test',
    },

    update: {
      name: 'Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },

    create: {
      name: 'Administrator',
      email: 'admin@marketplace-tunas.test',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('');
    console.error('❌ Seed gagal:');
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
