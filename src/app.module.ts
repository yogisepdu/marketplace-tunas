import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { DownloadModule } from './download/download.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    StorageModule,

    HealthModule,

    CatalogModule,

    AuthModule,

    AdminModule,

    DownloadModule,

    CheckoutModule,

    PaymentsModule,

    EmailModule,
  ],
})
export class AppModule {}
