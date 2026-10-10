import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*
  |--------------------------------------------------------------------------
  | Global API Prefix
  |--------------------------------------------------------------------------
  */

  app.setGlobalPrefix('api');

  /*
  |--------------------------------------------------------------------------
  | Global Validation
  |--------------------------------------------------------------------------
  |
  | whitelist:
  | Hanya property yang terdapat di DTO yang diterima.
  |
  | forbidNonWhitelisted:
  | Request dengan property asing akan ditolak.
  |
  | transform:
  | TypeScript DTO dapat melakukan transformasi tipe.
  |
  */

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /*
  |--------------------------------------------------------------------------
  | CORS
  |--------------------------------------------------------------------------
  */

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  app.enableCors({
    origin: [frontendUrl],

    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Checkout-Token',
    ],
  });

  /*
  |--------------------------------------------------------------------------
  | Start Server
  |--------------------------------------------------------------------------
  */

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
