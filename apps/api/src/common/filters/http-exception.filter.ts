import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithCorrelationId } from '../interceptors/correlation-id.middleware.js';
import { StandardApiResponse } from '@platform/types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithCorrelationId>();

    const correlationId = request.correlationId || 'unknown';
    const timestamp = new Date().toISOString();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || message;
        errorCode = (obj.error as string) || errorCode;
        details = obj.details || (Array.isArray(obj.message) ? obj.message : null);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name;
    }

    const payload: StandardApiResponse = {
      success: false,
      statusCode,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message[0] : message,
        details,
      },
      correlationId,
      timestamp,
    };

    response.status(statusCode).json(payload);
  }
}
