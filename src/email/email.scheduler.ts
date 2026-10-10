import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { EmailService } from './email.service';

@Injectable()
export class EmailScheduler {
  private readonly logger = new Logger(EmailScheduler.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Menjalankan proses email setiap menit.
   */
  @Cron('0 * * * * *')
  async processPendingEmails() {
    try {
      const result = await this.emailService.sendPendingEmails();

      if (result.total > 0) {
        this.logger.log(`Email notification diproses: ${result.total}`);
      }
    } catch (error) {
      this.logger.error(
        'Gagal menjalankan email scheduler',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
