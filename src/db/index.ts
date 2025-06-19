import { drizzle } from 'drizzle-orm/postgres-js';
import env from '@/utils/env';

// You can specify any property from the postgres-js connection options
export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }
});

// Export schemas
export * from './schema/service';
export * from './schema/aws-resources';
export * from './schema/aws-accounts';
