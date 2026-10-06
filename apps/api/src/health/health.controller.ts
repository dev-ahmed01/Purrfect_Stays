import { Controller, Get } from '@nestjs/common';
import { DatabaseHealthService } from '../common/database/database-health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  @Get()
  liveness() {
    return {
      status: 'ok',
      service: 'purrfect-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async readiness() {
    const dependencies = await this.databaseHealth.check();

    return {
      status: 'ready',
      dependencies,
      timestamp: new Date().toISOString(),
    };
  }
}
