import 'dotenv/config';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

import {
  AccessStatus,
  AdminRole,
  AdminStatus,
  DownloadStatus,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  Prisma,
  PrismaClient,
  ProductStatus,
} from '../src/generated/prisma/client';

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
  console.log('🌱 Starting database seed...');

  // ---------------------------------------------------------------------------
  // WARNING:
  // This seed resets all application data before inserting the demo dataset.
  // Do NOT run this in production.
  // ---------------------------------------------------------------------------

  await prisma.$transaction(async (tx) => {
    // Delete child records first to respect foreign-key constraints.
    await tx.downloadLog.deleteMany();
    await tx.productAccess.deleteMany();
    await tx.emailNotification.deleteMany();
    await tx.paymentNotification.deleteMany();
    await tx.payment.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.productFile.deleteMany();
    await tx.product.deleteMany();
    await tx.course.deleteMany();
    await tx.studyProgram.deleteMany();
    await tx.customer.deleteMany();
    await tx.adminUser.deleteMany();

    // -------------------------------------------------------------------------
    // ADMIN USERS
    // -------------------------------------------------------------------------
    const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

    const admin = await tx.adminUser.create({
      data: {
        name: 'Administrator',
        email: 'admin@marketplace-tunas.test',
        passwordHash: adminPasswordHash,
        role: AdminRole.ADMIN,
        status: AdminStatus.ACTIVE,
      },
    });

    const editorPasswordHash = await bcrypt.hash('Editor123!', 10);

    const editor = await tx.adminUser.create({
      data: {
        name: 'Content Editor',
        email: 'editor@marketplace-tunas.test',
        passwordHash: editorPasswordHash,
        role: AdminRole.EDITOR,
        status: AdminStatus.ACTIVE,
      },
    });

    // -------------------------------------------------------------------------
    // STUDY PROGRAMS
    // -------------------------------------------------------------------------
    const sistemInformasi = await tx.studyProgram.create({
      data: {
        name: 'S1 Sistem Informasi',
        code: 'SI',
        description:
          'Program studi yang mempelajari sistem informasi, proses bisnis, basis data, pemrograman, dan teknologi informasi.',
        image: '/images/study-programs/sistem-informasi.jpg',
        isActive: true,
      },
    });

    const teknikInformatika = await tx.studyProgram.create({
      data: {
        name: 'S1 Teknik Informatika',
        code: 'TI',
        description:
          'Program studi yang berfokus pada pemrograman, algoritma, rekayasa perangkat lunak, dan teknologi komputer.',
        image: '/images/study-programs/teknik-informatika.jpg',
        isActive: true,
      },
    });

    const manajemenInformatika = await tx.studyProgram.create({
      data: {
        name: 'D3 Manajemen Informatika',
        code: 'MI',
        description:
          'Program studi vokasional bidang manajemen dan penerapan teknologi informasi.',
        image: '/images/study-programs/manajemen-informatika.jpg',
        isActive: true,
      },
    });

    // -------------------------------------------------------------------------
    // COURSES
    // -------------------------------------------------------------------------
    const basisData = await tx.course.create({
      data: {
        studyProgramId: sistemInformasi.id,
        code: 'STSI4105',
        name: 'Basis Data',
        semester: 2,
        credits: 3,
        image: '/images/courses/basis-data.jpg',
        isActive: true,
      },
    });

    const logikaInformatika = await tx.course.create({
      data: {
        studyProgramId: sistemInformasi.id,
        code: 'STSI4106',
        name: 'Logika Informatika',
        semester: 2,
        credits: 3,
        image: '/images/courses/logika-informatika.jpg',
        isActive: true,
      },
    });

    const prosesBisnis = await tx.course.create({
      data: {
        studyProgramId: sistemInformasi.id,
        code: 'STSI4206',
        name: 'Proses Bisnis',
        semester: 3,
        credits: 3,
        image: '/images/courses/proses-bisnis.jpg',
        isActive: true,
      },
    });

    const sistemInformasiManajemen = await tx.course.create({
      data: {
        studyProgramId: sistemInformasi.id,
        code: 'STSI4207',
        name: 'Sistem Informasi Manajemen',
        semester: 3,
        credits: 3,
        image: '/images/courses/sistem-informasi-manajemen.jpg',
        isActive: true,
      },
    });

    const analisisPerancanganSistem = await tx.course.create({
      data: {
        studyProgramId: sistemInformasi.id,
        code: 'STSI4208',
        name: 'Analisis dan Perancangan Sistem',
        semester: 4,
        credits: 3,
        image: '/images/courses/analisis-perancangan-sistem.jpg',
        isActive: true,
      },
    });

    const pemrogramanWeb = await tx.course.create({
      data: {
        studyProgramId: sistemInformasi.id,
        code: 'STSI4209',
        name: 'Pemrograman Berbasis Web',
        semester: 4,
        credits: 3,
        image: '/images/courses/pemrograman-web.jpg',
        isActive: true,
      },
    });

    const pemrogramanDasar = await tx.course.create({
      data: {
        studyProgramId: teknikInformatika.id,
        code: 'TI4101',
        name: 'Pemrograman Dasar',
        semester: 1,
        credits: 3,
        image: '/images/courses/pemrograman-dasar.jpg',
        isActive: true,
      },
    });

    const algoritma = await tx.course.create({
      data: {
        studyProgramId: teknikInformatika.id,
        code: 'TI4102',
        name: 'Algoritma dan Struktur Data',
        semester: 1,
        credits: 3,
        image: '/images/courses/algoritma-struktur-data.jpg',
        isActive: true,
      },
    });

    const aplikasiPerkantoran = await tx.course.create({
      data: {
        studyProgramId: manajemenInformatika.id,
        code: 'MI4101',
        name: 'Aplikasi Perkantoran',
        semester: 1,
        credits: 3,
        image: '/images/courses/aplikasi-perkantoran.jpg',
        isActive: true,
      },
    });

    // -------------------------------------------------------------------------
    // PRODUCTS
    // -------------------------------------------------------------------------
    const productBasisData = await tx.product.create({
      data: {
        courseId: basisData.id,
        title: 'Modul Lengkap Basis Data',
        slug: 'modul-lengkap-basis-data',
        description:
          'Materi pembelajaran dan latihan Basis Data untuk kebutuhan belajar mahasiswa.',
        price: new Prisma.Decimal('75000'),
        thumbnail: '/images/products/modul-basis-data.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productLogika = await tx.product.create({
      data: {
        courseId: logikaInformatika.id,
        title: 'Modul Logika Informatika',
        slug: 'modul-logika-informatika',
        description: 'Kumpulan materi dan latihan Logika Informatika.',
        price: new Prisma.Decimal('65000'),
        thumbnail: '/images/products/modul-logika-informatika.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productProsesBisnis = await tx.product.create({
      data: {
        courseId: prosesBisnis.id,
        title: 'Modul Proses Bisnis',
        slug: 'modul-proses-bisnis',
        description:
          'Materi pembelajaran Proses Bisnis beserta contoh latihan.',
        price: new Prisma.Decimal('70000'),
        thumbnail: '/images/products/modul-proses-bisnis.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productSim = await tx.product.create({
      data: {
        courseId: sistemInformasiManajemen.id,
        title: 'Modul Sistem Informasi Manajemen',
        slug: 'modul-sistem-informasi-manajemen',
        description: 'Materi pembelajaran Sistem Informasi Manajemen.',
        price: new Prisma.Decimal('70000'),
        thumbnail: '/images/products/modul-sim.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productAnalisis = await tx.product.create({
      data: {
        courseId: analisisPerancanganSistem.id,
        title: 'Modul Analisis dan Perancangan Sistem',
        slug: 'modul-analisis-perancangan-sistem',
        description: 'Materi pembelajaran Analisis dan Perancangan Sistem.',
        price: new Prisma.Decimal('85000'),
        thumbnail: '/images/products/modul-analisis-sistem.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productWeb = await tx.product.create({
      data: {
        courseId: pemrogramanWeb.id,
        title: 'Modul Pemrograman Berbasis Web',
        slug: 'modul-pemrograman-berbasis-web',
        description:
          'Materi HTML, CSS, JavaScript, dan pengembangan aplikasi web.',
        price: new Prisma.Decimal('90000'),
        thumbnail: '/images/products/modul-pemrograman-web.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productPemrogramanDasar = await tx.product.create({
      data: {
        courseId: pemrogramanDasar.id,
        title: 'Modul Pemrograman Dasar',
        slug: 'modul-pemrograman-dasar',
        description:
          'Materi dasar pemrograman untuk mahasiswa Teknik Informatika.',
        price: new Prisma.Decimal('65000'),
        thumbnail: '/images/products/modul-pemrograman-dasar.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productAlgoritma = await tx.product.create({
      data: {
        courseId: algoritma.id,
        title: 'Modul Algoritma dan Struktur Data',
        slug: 'modul-algoritma-struktur-data',
        description: 'Materi algoritma dan struktur data beserta latihan.',
        price: new Prisma.Decimal('80000'),
        thumbnail: '/images/products/modul-algoritma.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    const productPerkantoran = await tx.product.create({
      data: {
        courseId: aplikasiPerkantoran.id,
        title: 'Modul Aplikasi Perkantoran',
        slug: 'modul-aplikasi-perkantoran',
        description: 'Materi aplikasi perkantoran dan latihan praktikum.',
        price: new Prisma.Decimal('55000'),
        thumbnail: '/images/products/modul-aplikasi-perkantoran.jpg',
        status: ProductStatus.ACTIVE,
      },
    });

    // -------------------------------------------------------------------------
    // PRODUCT FILES
    // -------------------------------------------------------------------------
    const basisDataFile = await tx.productFile.create({
      data: {
        productId: productBasisData.id,
        fileName: 'modul-lengkap-basis-data.pdf',
        filePath: 'uploads/products/modul-lengkap-basis-data.pdf',
        fileSize: 2500000,
        mimeType: 'application/pdf',
      },
    });

    const basisDataExerciseFile = await tx.productFile.create({
      data: {
        productId: productBasisData.id,
        fileName: 'latihan-basis-data.pdf',
        filePath: 'uploads/products/latihan-basis-data.pdf',
        fileSize: 1200000,
        mimeType: 'application/pdf',
      },
    });

    const logikaFile = await tx.productFile.create({
      data: {
        productId: productLogika.id,
        fileName: 'modul-logika-informatika.pdf',
        filePath: 'uploads/products/modul-logika-informatika.pdf',
        fileSize: 1800000,
        mimeType: 'application/pdf',
      },
    });

    const prosesBisnisFile = await tx.productFile.create({
      data: {
        productId: productProsesBisnis.id,
        fileName: 'modul-proses-bisnis.pdf',
        filePath: 'uploads/products/modul-proses-bisnis.pdf',
        fileSize: 2000000,
        mimeType: 'application/pdf',
      },
    });

    const simFile = await tx.productFile.create({
      data: {
        productId: productSim.id,
        fileName: 'modul-sistem-informasi-manajemen.pdf',
        filePath: 'uploads/products/modul-sistem-informasi-manajemen.pdf',
        fileSize: 2200000,
        mimeType: 'application/pdf',
      },
    });

    const analisisFile = await tx.productFile.create({
      data: {
        productId: productAnalisis.id,
        fileName: 'modul-analisis-perancangan-sistem.pdf',
        filePath: 'uploads/products/modul-analisis-perancangan-sistem.pdf',
        fileSize: 2700000,
        mimeType: 'application/pdf',
      },
    });

    const webFile = await tx.productFile.create({
      data: {
        productId: productWeb.id,
        fileName: 'modul-pemrograman-berbasis-web.pdf',
        filePath: 'uploads/products/modul-pemrograman-berbasis-web.pdf',
        fileSize: 3200000,
        mimeType: 'application/pdf',
      },
    });

    const pemrogramanDasarFile = await tx.productFile.create({
      data: {
        productId: productPemrogramanDasar.id,
        fileName: 'modul-pemrograman-dasar.pdf',
        filePath: 'uploads/products/modul-pemrograman-dasar.pdf',
        fileSize: 1600000,
        mimeType: 'application/pdf',
      },
    });

    const algoritmaFile = await tx.productFile.create({
      data: {
        productId: productAlgoritma.id,
        fileName: 'modul-algoritma-struktur-data.pdf',
        filePath: 'uploads/products/modul-algoritma-struktur-data.pdf',
        fileSize: 2400000,
        mimeType: 'application/pdf',
      },
    });

    const perkantoranFile = await tx.productFile.create({
      data: {
        productId: productPerkantoran.id,
        fileName: 'modul-aplikasi-perkantoran.pdf',
        filePath: 'uploads/products/modul-aplikasi-perkantoran.pdf',
        fileSize: 1400000,
        mimeType: 'application/pdf',
      },
    });

    // -------------------------------------------------------------------------
    // CUSTOMERS
    // -------------------------------------------------------------------------
    const customerPaid = await tx.customer.create({
      data: {
        name: 'Yogi Sepdu Dehiya',
        email: 'yogi@example.com',
        whatsapp: '081234567890',
      },
    });

    const customerPending = await tx.customer.create({
      data: {
        name: 'Demo Customer',
        email: 'customer@example.com',
        whatsapp: '081298765432',
      },
    });

    // -------------------------------------------------------------------------
    // PAID ORDER
    // -------------------------------------------------------------------------
    const paidOrder = await tx.order.create({
      data: {
        orderNumber: 'ORD-SEED-PAID-001',
        customerId: customerPaid.id,
        subtotal: new Prisma.Decimal('75000'),
        discountAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('75000'),
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    });

    const paidOrderItem = await tx.orderItem.create({
      data: {
        orderId: paidOrder.id,
        productId: productBasisData.id,
        productTitle: productBasisData.title,
        unitPrice: productBasisData.price,
        quantity: 1,
        subtotal: new Prisma.Decimal('75000'),
      },
    });

    const paidPayment = await tx.payment.create({
      data: {
        orderId: paidOrder.id,
        provider: 'MIDTRANS',
        transactionId: 'SEED-TRX-PAID-001',
        orderIdProvider: paidOrder.orderNumber,
        paymentType: PaymentType.QRIS,
        transactionStatus: PaymentStatus.SETTLEMENT,
        grossAmount: new Prisma.Decimal('75000'),
        snapToken: 'SEED-SNAP-TOKEN-PAID',
        redirectUrl: null,
        transactionTime: new Date(),
        settlementTime: new Date(),
        fraudStatus: 'accept',
        signatureKeyVerified: true,
        rawResponse: JSON.stringify({
          seed: true,
          transaction_status: 'settlement',
          fraud_status: 'accept',
          payment_type: 'qris',
          gross_amount: '75000.00',
          order_id: paidOrder.orderNumber,
        }),
      },
    });

    const paidNotification = await tx.paymentNotification.create({
      data: {
        paymentId: paidPayment.id,
        provider: 'MIDTRANS',
        notificationKey: 'SEED-NOTIFICATION-KEY-001',
        transactionId: paidPayment.transactionId,
        orderIdProvider: paidOrder.orderNumber,
        statusCode: '200',
        transactionStatus: 'settlement',
        fraudStatus: 'accept',
        signatureValid: true,
        payload: JSON.stringify({
          seed: true,
          transaction_id: paidPayment.transactionId,
          order_id: paidOrder.orderNumber,
          transaction_status: 'settlement',
          fraud_status: 'accept',
          gross_amount: '75000.00',
        }),
        processedAt: new Date(),
      },
    });

    const productAccess = await tx.productAccess.create({
      data: {
        orderId: paidOrder.id,
        productId: productBasisData.id,
        accessToken: 'seed-access-token-basis-data-001-9f3b8d7a6c5e4b2a',
        status: AccessStatus.ACTIVE,
      },
    });

    const downloadLog = await tx.downloadLog.create({
      data: {
        productAccessId: productAccess.id,
        fileId: basisDataFile.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Seed/1.0',
        status: DownloadStatus.SUCCESS,
      },
    });

    const emailNotification = await tx.emailNotification.create({
      data: {
        orderId: paidOrder.id,
        recipient: customerPaid.email,
        subject: 'Akses Produk - ' + paidOrder.orderNumber,
        status: NotificationStatus.PENDING,
        attempts: 0,
      },
    });

    // -------------------------------------------------------------------------
    // PENDING ORDER
    // -------------------------------------------------------------------------
    const pendingOrder = await tx.order.create({
      data: {
        orderNumber: 'ORD-SEED-PENDING-001',
        customerId: customerPending.id,
        subtotal: new Prisma.Decimal('90000'),
        discountAmount: new Prisma.Decimal('0'),
        totalAmount: new Prisma.Decimal('90000'),
        status: OrderStatus.PENDING,
      },
    });

    const pendingOrderItem = await tx.orderItem.create({
      data: {
        orderId: pendingOrder.id,
        productId: productWeb.id,
        productTitle: productWeb.title,
        unitPrice: productWeb.price,
        quantity: 1,
        subtotal: new Prisma.Decimal('90000'),
      },
    });

    const pendingPayment = await tx.payment.create({
      data: {
        orderId: pendingOrder.id,
        provider: 'MIDTRANS',
        transactionId: 'SEED-TRX-PENDING-001',
        orderIdProvider: pendingOrder.orderNumber,
        paymentType: PaymentType.BANK_TRANSFER,
        transactionStatus: PaymentStatus.PENDING,
        grossAmount: new Prisma.Decimal('90000'),
        snapToken: 'SEED-SNAP-TOKEN-PENDING',
        transactionTime: new Date(),
        fraudStatus: null,
        signatureKeyVerified: false,
        rawResponse: JSON.stringify({
          seed: true,
          transaction_status: 'pending',
          payment_type: 'bank_transfer',
          gross_amount: '90000.00',
          order_id: pendingOrder.orderNumber,
        }),
      },
    });

    const pendingNotification = await tx.paymentNotification.create({
      data: {
        paymentId: pendingPayment.id,
        provider: 'MIDTRANS',
        notificationKey: 'SEED-NOTIFICATION-KEY-002',
        transactionId: pendingPayment.transactionId,
        orderIdProvider: pendingOrder.orderNumber,
        statusCode: '201',
        transactionStatus: 'pending',
        fraudStatus: null,
        signatureValid: true,
        payload: JSON.stringify({
          seed: true,
          transaction_id: pendingPayment.transactionId,
          order_id: pendingOrder.orderNumber,
          transaction_status: 'pending',
          gross_amount: '90000.00',
        }),
        processedAt: new Date(),
      },
    });

    // -------------------------------------------------------------------------
    // Additional email notification example
    // -------------------------------------------------------------------------
    await tx.emailNotification.create({
      data: {
        orderId: pendingOrder.id,
        recipient: customerPending.email,
        subject: 'Menunggu Pembayaran - ' + pendingOrder.orderNumber,
        status: NotificationStatus.PENDING,
        attempts: 0,
      },
    });

    console.log('✅ Seed data created successfully.');
    console.log(`   Admin      : ${admin.email} / Admin123!`);
    console.log(`   Editor     : ${editor.email} / Editor123!`);
    console.log(`   Paid Order : ${paidOrder.orderNumber}`);
    console.log(`   Pending    : ${pendingOrder.orderNumber}`);
    console.log(`   Customer   : ${customerPaid.email}`);
    console.log(`   Payment    : ${paidPayment.transactionStatus}`);
    console.log(`   Access     : ${productAccess.accessToken}`);
    console.log(`   Email      : ${emailNotification.status}`);
    console.log(
      `   Files      : ${basisDataFile.fileName}, ${basisDataExerciseFile.fileName}`,
    );
    console.log(`   Notification: ${paidNotification.notificationKey}`);
    console.log(`   DownloadLog : ${downloadLog.status}`);
    console.log(
      `   Pending payment notification: ${pendingNotification.notificationKey}`,
    );
    console.log(`   Pending item: ${pendingOrderItem.productTitle}`);
  });
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
