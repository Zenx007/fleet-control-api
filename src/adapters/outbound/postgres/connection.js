import pg from 'pg';

export function createPool(databaseUrl) {
  const pool = new pg.Pool({ connectionString: databaseUrl });

  pool.on('error', (error) => {
    console.error('Unexpected error on idle database connection', error);
  });

  return pool;
}
