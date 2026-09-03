import { Module } from '@nestjs/common';
import { MarketingService } from './marketing.service.js';
import { MarketingController } from './marketing.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
