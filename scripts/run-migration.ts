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
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf-8');
  
  try {
    await prisma.$executeRawUnsafe(sql);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();

