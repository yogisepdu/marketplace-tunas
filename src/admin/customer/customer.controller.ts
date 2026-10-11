import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { CustomerService } from './customer.service';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async findAll() {
    const data = await this.customerService.findAll();

    return {
      success: true,
      message: 'Data pengguna berhasil diambil',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.customerService.findOne(id);

    return {
      success: true,
      message: 'Detail pengguna berhasil diambil',
      data,
    };
  }
}
