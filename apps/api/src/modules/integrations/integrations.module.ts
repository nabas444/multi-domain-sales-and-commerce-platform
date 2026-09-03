import { Module, Global } from '@nestjs/common';
import { IntegrationsService } from './integrations.service.js';
import { IntegrationsController } from './integrations.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Global()
@Module({
  imports: [AuditModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
