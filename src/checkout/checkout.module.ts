import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { CheckoutTokenService } from './checkout-token.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [PrismaModule],

  controllers: [CheckoutController],

  providers: [CheckoutService, CheckoutTokenService],

  exports: [CheckoutService, CheckoutTokenService],
})
export class CheckoutModule {}
