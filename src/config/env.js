import { z } from 'zod';

const schema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5433/fleet'),
    APP_URL: z.url({ protocol: /^https?$/ }).optional(),
  })
  .transform(({ APP_URL, ...variables }) => ({
    ...variables,
    APP_URL: (APP_URL ?? `http://localhost:${variables.PORT}`).replace(/\/+$/, ''),
  }));

const result = schema.safeParse(process.env);

if (!result.success) {
  const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new Error(`Invalid environment variables: ${fields}`);
}

export const env = result.data;
