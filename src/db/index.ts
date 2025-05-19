import { drizzle } from 'drizzle-orm/postgres-js';
import env from '@/utils/env';

// You can specify any property from the postgres-js connection options
export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
  }
});
