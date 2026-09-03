import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root if available
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']).default('development'),
  PLATFORM_NAME: z.string().default('Multi-Domain Sales & Commerce Platform'),
  DEFAULT_CURRENCY: z.string().default('ETB'),

  // API
  API_PORT: z.coerce.number().default(4000),
  API_URL: z.string().default('http://localhost:4000'),

  // Web
  WEB_PORT: z.coerce.number().default(3000),
  WEB_URL: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z
    .string()
    .default('postgresql://platform_admin:platform_secure_password@localhost:5432/platform_core?sslmode=disable'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default('platform_admin'),
  POSTGRES_PASSWORD: z.string().default('platform_secure_password'),
  POSTGRES_DB: z.string().default('platform_core'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  // S3 / MinIO
  S3_ENDPOINT: z.string().default('localhost'),
  S3_PORT: z.coerce.number().default(9000),
  S3_USE_SSL: z.coerce.boolean().default(false),
  S3_ACCESS_KEY: z.string().default('minio_admin'),
  S3_SECRET_KEY: z.string().default('minio_secure_password'),
  S3_BUCKET_NAME: z.string().default('platform-media'),
  S3_REGION: z.string().default('us-east-1'),

  // Auth & Security
  JWT_SECRET: z.string().min(16).default('dev_jwt_secret_change_in_production_super_secure_32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(16).default('dev_session_secret_change_in_production_32chars'),
  COOKIE_SECRET: z.string().min(16).default('dev_cookie_secret_change_in_production_32chars'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('debug'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadEnv(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}

export const env = loadEnv();
