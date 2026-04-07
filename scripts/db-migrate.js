/**
 * Database Migration Script
 * Generates and applies Drizzle ORM migrations
 */

import { spawnSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'server/db/migrations');

/**
 * Execute command safely using spawnSync
 */
function executeCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(`Command failed with status ${result.status}`);
  }

  return result;
}

/**
 * Generate migration
 */
async function generateMigration(name) {
  console.log(`Generating migration: ${name}`);

  try {
    executeCommand('npx', ['drizzle-kit', 'generate', `--name=${name}`]);

    console.log(`✓ Migration generated: ${name}`);
  } catch (error) {
    console.error('✗ Migration generation failed:', error.message);
    process.exit(1);
  }
}

/**
 * Apply migrations
 */
async function applyMigrations() {
  console.log('Applying database migrations...');

  try {
    // This would typically use drizzle-kit push or migrate
    // For now, we'll use push for development
    executeCommand('npx', ['drizzle-kit', 'push']);

    console.log('✓ Migrations applied successfully');
  } catch (error) {
    console.error('✗ Migration application failed:', error.message);
    process.exit(1);
  }
}

/**
 * Show migration status
 */
async function migrationStatus() {
  console.log('Checking migration status...');

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    console.log(`\nFound ${sqlFiles.length} migration files:`);
    for (const file of sqlFiles) {
      console.log(`  - ${file}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No migrations directory found');
    } else {
      console.error('Error checking migrations:', error.message);
    }
  }
}

// Parse command line arguments
const command = process.argv[2];
const name = process.argv[3];

switch (command) {
  case 'generate':
    if (!name) {
      console.error('Usage: node scripts/db-migrate.js generate <migration-name>');
      process.exit(1);
    }
    generateMigration(name);
    break;

  case 'apply':
    applyMigrations();
    break;

  case 'status':
    migrationStatus();
    break;

  default:
    console.log(`
Usage: node scripts/db-migrate.js <command> [options]

Commands:
  generate <name>  Generate a new migration
  apply            Apply all pending migrations
  status           Show migration status

Examples:
  node scripts/db-migrate.js generate initial_schema
  node scripts/db-migrate.js apply
  node scripts/db-migrate.js status
    `);
    process.exit(1);
}
