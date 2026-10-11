import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { OrderService } from './order.service';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll() {
    const data = await this.orderService.findAll();

    return {
      success: true,
      message: 'Data pesanan berhasil diambil',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.orderService.findOne(id);

    return {
      success: true,
      message: 'Detail pesanan berhasil diambil',
      data,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    const data = await this.orderService.updateStatus(id, status);

    return {
      success: true,
      message: 'Status pesanan berhasil diperbarui',
      data,
    };
  }
}
