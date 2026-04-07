/**
 * Drizzle Kit Configuration
 * For database migrations and management
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema.js',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:analisi_tracker',
  },
});
