import { Injectable, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginAdmin(dto: AdminLoginDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (admin.status !== 'ACTIVE') {
      throw new UnauthorizedException('Akun admin tidak aktif');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.adminUser.update({
      where: {
        id: admin.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}
