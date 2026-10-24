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
  console.log('🌱 Memulai seed akun...');

  // =====================================================
  // PASSWORD
  // =====================================================

  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const userPasswordHash = await bcrypt.hash('User123!', 12);

  // =====================================================
  // ADMIN
  // =====================================================

  const admin = await prisma.adminUser.upsert({
    where: {
      email: 'admin@marketplace-tunas.test',
    },

    update: {
      name: 'Administrator',
      passwordHash: adminPasswordHash,
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

  // =====================================================
  // USER
  // =====================================================

  const user = await prisma.adminUser.upsert({
    where: {
      email: 'retnoang@gmail.com',
    },

    update: {
      name: 'Retno Ang',
      passwordHash: userPasswordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
    },

    create: {
      name: 'Retno Ang',
      email: 'retnoang@gmail.com',
      passwordHash: userPasswordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
    },
  });

  console.log(`✓ User: ${user.email}`);

  // =====================================================
  // SUMMARY
  // =====================================================

  console.log('');
  console.log('========================================');
  console.log('🌱 SEED AKUN BERHASIL');
  console.log('========================================');

  console.log('');
  console.log('ADMIN');
  console.log('Email    : admin@marketplace-tunas.test');
  console.log('Password : Admin123!');
  console.log('Role     : ADMIN');

  console.log('');
  console.log('USER');
  console.log('Email    : retnoang@gmail.com');
  console.log('Password : User123!');
  console.log('Role     : EDITOR');

  console.log('');
  console.log('========================================');
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
