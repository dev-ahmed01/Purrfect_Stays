import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'purrfect-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  readiness() {
    return {
      status: 'ready',
    };
  }
}
