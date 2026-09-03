import { Module } from '@nestjs/common';
import { CrmService } from './crm.service.js';
import { CrmController } from './crm.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
