import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });
config({ path: path.join(__dirname, '../.env') });

(async () => {
  const { prisma } = await import('../lib/prisma');

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
})();
