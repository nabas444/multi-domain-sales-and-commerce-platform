import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { ModerationController } from './moderation.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
