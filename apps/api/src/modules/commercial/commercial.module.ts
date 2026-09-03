import { Module } from '@nestjs/common';
import { CommercialService } from './commercial.service.js';
import { CommercialController } from './commercial.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [CommercialController],
  providers: [CommercialService],
  exports: [CommercialService],
})
export class CommercialModule {}
