/**
 * Database Connection
 * PostgreSQL connection with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:analisi_tracker';

// Connection pool configuration
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Graceful shutdown
export async function closeDatabase() {
  await client.end();
}

// Export schema for use in queries
export * from './schema.js';
