import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
  max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const query = async (text: string, params?: any[]) => {
  const client = await getClient();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

export const closePool = async () => {
  await pool.end();
};

export default pool;
