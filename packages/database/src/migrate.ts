import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPool } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const client = await dbPool.connect();
  try {
    console.log('🚀 Starting database migrations...');

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Fetch applied migrations
    const { rows } = await client.query<{ name: string }>(
      'SELECT name FROM public.schema_migrations ORDER BY id ASC'
    );
    const appliedMigrations = new Set(rows.map((r) => r.name));

    // Read migration files
    const migrationsDir = path.resolve(__dirname, '../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`⏩ Skipping already applied migration: ${file}`);
        continue;
      }

      console.log(`⚙️ Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO public.schema_migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Applied migration: ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed migration ${file}:`, err);
        throw err;
      }
    }

    console.log(`🎉 Migrations complete. Applied ${count} new migrations.`);
  } finally {
    client.release();
  }
}

// Execute directly if run via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during migration:', err);
      process.exit(1);
    });
}
