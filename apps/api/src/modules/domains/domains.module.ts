import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service.js';
import { DomainsController } from './domains.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
