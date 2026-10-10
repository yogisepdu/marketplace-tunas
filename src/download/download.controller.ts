import { Controller, Get, Param, ParseIntPipe, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get(':accessToken/:fileId')
  async downloadFile(
    @Param('accessToken')
    accessToken: string,

    @Param('fileId', ParseIntPipe)
    fileId: number,

    @Req()
    req: Request,

    @Res()
    res: Response,
  ) {
    const file = await this.downloadService.getFile(accessToken, fileId);

    res.download(file.absolutePath, file.fileName, async (error) => {
      await this.downloadService.logDownload(
        file.accessId,
        file.fileId,
        error ? 'FAILED' : 'SUCCESS',
        this.getClientIp(req),
        req.headers['user-agent'],
      );

      if (error && !res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Gagal mengunduh file',
        });
      }
    });
  }

  private getClientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];

    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    if (Array.isArray(forwarded)) {
      return forwarded[0];
    }

    return req.ip;
  }
}
