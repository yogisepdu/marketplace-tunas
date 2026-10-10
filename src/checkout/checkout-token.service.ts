import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createHmac, timingSafeEqual } from 'crypto';

interface CheckoutTokenPayload {
  orderNumber: string;
  exp: number;
}

@Injectable()
export class CheckoutTokenService {
  /**
   * Token berlaku selama 24 jam.
   */
  private readonly ttlSeconds = 24 * 60 * 60;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Membuat checkout token.
   *
   * Token:
   *
   * base64url(payload).signature
   *
   * Signature menggunakan HMAC SHA256.
   */
  issue(orderNumber: string): string {
    const secret = this.getSecret();

    const payload: CheckoutTokenPayload = {
      orderNumber,

      exp: Math.floor(Date.now() / 1000) + this.ttlSeconds,
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );

    const signature = this.sign(encodedPayload, secret);

    return `${encodedPayload}.${signature}`;
  }

  /**
   * Memvalidasi checkout token.
   */
  verify(token: string | undefined, expectedOrderNumber: string): void {
    if (!token) {
      throw new BadRequestException('Checkout token wajib dikirim');
    }

    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      throw new BadRequestException('Checkout token tidak valid');
    }

    const secret = this.getSecret();

    const expectedSignature = this.sign(encodedPayload, secret);

    const signatureBuffer = Buffer.from(signature);

    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new BadRequestException('Checkout token tidak valid');
    }

    let payload: CheckoutTokenPayload;

    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as CheckoutTokenPayload;
    } catch {
      throw new BadRequestException('Checkout token tidak valid');
    }

    /*
     * Token harus berasal dari order
     * yang sedang diminta.
     */

    if (!payload.orderNumber || payload.orderNumber !== expectedOrderNumber) {
      throw new BadRequestException('Checkout token tidak sesuai dengan order');
    }

    /*
     * Periksa expiration.
     */

    if (
      !Number.isFinite(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      throw new BadRequestException('Checkout token sudah kedaluwarsa');
    }
  }

  private getSecret(): string {
    const secret = this.configService.get<string>('CHECKOUT_TOKEN_SECRET');

    if (!secret || secret.length < 32) {
      throw new Error(
        'CHECKOUT_TOKEN_SECRET harus dikonfigurasi dan minimal 32 karakter',
      );
    }

    return secret;
  }

  private sign(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
