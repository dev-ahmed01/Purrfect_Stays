import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('api/v1'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  JSON_BODY_LIMIT: z.string().regex(/^\d+(kb|mb)$/i).default('128kb'),
  RATE_LIMIT_TTL_MS: z.coerce.number().int().min(1000).max(3_600_000).default(60_000),
  RATE_LIMIT_LIMIT: z.coerce.number().int().min(1).max(10_000).default(120),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().regex(/^\d+[smhd]$/).default('15m'),
  JWT_ISSUER: z.string().min(1).default('purrfect-api'),
  JWT_AUDIENCE: z.string().min(1).default('purrfect-web'),
  REFRESH_TOKEN_TTL: z.string().regex(/^\d+[smhd]$/).default('30d'),
  REFRESH_COOKIE_NAME: z.string().min(1).default('purrfect_refresh'),
  BOOKING_TAX_RATE_BPS: z.coerce.number().int().min(0).max(10_000).default(1200),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return result.data;
}
