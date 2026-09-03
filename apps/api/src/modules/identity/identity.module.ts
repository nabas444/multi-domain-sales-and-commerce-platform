import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { env } from '@platform/config';
import { IdentityService } from './identity.service.js';
import { IdentityController } from './identity.controller.js';
import { JwtStrategy } from '../../common/auth/jwt.strategy.js';
import { AuditService } from '../../common/audit/audit.service.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: env.JWT_EXPIRES_IN as any },
    }),
  ],
  controllers: [IdentityController],
  providers: [IdentityService, JwtStrategy, AuditService],
  exports: [IdentityService, JwtModule, PassportModule],
})
export class IdentityModule {}
