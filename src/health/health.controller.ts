import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('database')
  async getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }

  @Get('tables')
  async getDatabaseTables() {
    return this.healthService.getDatabaseTables();
  }
}
