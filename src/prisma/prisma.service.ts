import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.get<string>('DB_HOST') ?? 'localhost',

      port: Number(configService.get<string>('DB_PORT')) || 3306,

      user: configService.get<string>('DB_USER') ?? 'root',

      password: configService.get<string>('DB_PASSWORD') ?? '',

      database: configService.get<string>('DB_NAME') ?? 'marketplace_tunas',

      connectionLimit: 5,
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
