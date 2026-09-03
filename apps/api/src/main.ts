import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { env } from '@platform/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser(env.COOKIE_SECRET));

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Multi-Domain Sales & Commerce Platform API')
    .setDescription('Core Platform REST API Specification')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = env.API_PORT;
  await app.listen(port);
  console.log(`🚀 Multi-Domain Platform API running on http://localhost:${port}/api/v1`);
  console.log(`📚 OpenAPI Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during API bootstrap:', err);
  process.exit(1);
});
