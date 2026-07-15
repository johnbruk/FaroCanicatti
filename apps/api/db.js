import pg from 'pg';
import 'dotenv/config';

// Pool di connessioni PostgreSQL. La configurazione arriva dalle variabili
// d'ambiente (vedi .env.example), con default adatti allo sviluppo locale.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'faro',
  password: process.env.PGPASSWORD || 'faro',
  database: process.env.PGDATABASE || 'faro_canicatti',
  max: Number(process.env.PG_POOL_MAX || 10)
});

export const query = (text, params) => pool.query(text, params);
