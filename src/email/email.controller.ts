import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';

import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('process')
  async processPendingEmails() {
    const data = await this.emailService.sendPendingEmails();

    return {
      success: true,
      message: 'Email notification berhasil diproses',
      data,
    };
  }

  @Post(':id/send')
  async sendEmail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.emailService.sendNotification(id);

    return {
      success: true,
      message: 'Email berhasil dikirim',
      data,
    };
  }
}
