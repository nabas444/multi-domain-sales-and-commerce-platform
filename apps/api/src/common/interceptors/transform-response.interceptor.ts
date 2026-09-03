import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestWithCorrelationId } from './correlation-id.middleware.js';
import { StandardApiResponse } from '@platform/types';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<StandardApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<RequestWithCorrelationId>();
    const res = httpContext.getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: res.statusCode || 200,
        data,
        correlationId: req.correlationId || 'unknown',
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
