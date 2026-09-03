import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { IdentityService } from './identity.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { LoginSchema, RegisterUserSchema } from '@platform/validation';
import { UserContext } from '@platform/types';
import { RequestWithCorrelationId } from '../../common/interceptors/correlation-id.middleware.js';

@Controller('auth')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('register')
  async register(
    @Body() body: unknown,
    @Req() req: RequestWithCorrelationId,
    @Res({ passthrough: true }) res: Response
  ) {
    const validated = RegisterUserSchema.parse(body);
    const session = await this.identityService.register(validated, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
    });

    res.cookie('platform_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return session;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Req() req: RequestWithCorrelationId,
    @Res({ passthrough: true }) res: Response
  ) {
    const validated = LoginSchema.parse(body);
    const session = await this.identityService.login(validated, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
    });

    res.cookie('platform_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return session;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('platform_token', { path: '/' });
    return { loggedOut: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: UserContext) {
    return user;
  }
}
