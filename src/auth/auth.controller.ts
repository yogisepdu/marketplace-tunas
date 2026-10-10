import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  async loginAdmin(@Body() dto: AdminLoginDto) {
    const data = await this.authService.loginAdmin(dto);

    return {
      success: true,
      message: 'Login admin berhasil',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/me')
  async getAdminProfile(@Req() req: Request) {
    return {
      success: true,
      message: 'Token valid',
      data: req.user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/test')
  async adminTest(@Req() req: Request) {
    return {
      success: true,
      message: 'Role ADMIN valid',
      data: req.user,
    };
  }
}
