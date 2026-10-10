import { Module } from '@nestjs/common';

import { EmailController } from './email.controller';
import { EmailScheduler } from './email.scheduler';
import { EmailService } from './email.service';

@Module({
  controllers: [EmailController],

  providers: [EmailService, EmailScheduler],

  exports: [EmailService],
})
export class EmailModule {}
