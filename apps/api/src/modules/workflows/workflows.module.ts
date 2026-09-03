import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service.js';
import { WorkflowsController } from './workflows.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
