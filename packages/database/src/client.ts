import pg from 'pg';
import { env } from '@platform/config';

export type { QueryResult, QueryResultRow } from 'pg';
export { pg };

const { Pool } = pg;

export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await dbPool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.LOG_LEVEL === 'trace') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
}

export async function getClient() {
  return await dbPool.connect();
}
