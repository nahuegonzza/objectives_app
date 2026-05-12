import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const migrationFile = path.join(__dirname, '../prisma/migrations/20260512_add_friend_requests/migration.sql');
  
  if (!fs.existsSync(migrationFile)) {
    console.error('Migration file not found:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf-8');
  
  try {
    console.log('🔄 Executing migration...');
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Migration executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

runMigration();
