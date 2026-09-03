import { Controller, Get } from '@nestjs/common';
import { dbPool } from '@platform/database';
import { env } from '@platform/config';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    let dbStatus = 'down';
    try {
      await dbPool.query('SELECT 1');
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    return {
      status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      platform: env.PLATFORM_NAME,
      services: {
        database: dbStatus,
        environment: env.NODE_ENV,
      },
    };
  }
}
