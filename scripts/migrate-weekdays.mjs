import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function normalizeDatabaseUrl(url) {
  if (!url) return url;
  let trimmedUrl = url.trim();
  if (
    (trimmedUrl.startsWith('"') && trimmedUrl.endsWith('"')) ||
    (trimmedUrl.startsWith("'") && trimmedUrl.endsWith("'"))
  ) {
    trimmedUrl = trimmedUrl.slice(1, -1).trim();
  }
  trimmedUrl = trimmedUrl.replace(/;$/, '').trim();

  if (/pooler\.supabase\.com|:6543/.test(trimmedUrl)) {
    try {
      const url = new URL(trimmedUrl);
      const params = url.searchParams;
      if (!params.has('sslmode')) params.set('sslmode', 'require');
      if (!params.has('sslaccept')) params.set('sslaccept', 'accept_invalid_certs');
      if (!params.has('uselibpqcompat')) params.set('uselibpqcompat', 'true');
      url.search = params.toString();
      return url.toString();
    } catch {
      let result = trimmedUrl;
      if (!/[?&]sslmode=/.test(result)) result += (result.includes('?') ? '&' : '?') + 'sslmode=require';
      if (!/[?&]sslaccept=/.test(result)) result += '&sslaccept=accept_invalid_certs';
      if (!/[?&]uselibpqcompat=/.test(result)) result += '&uselibpqcompat=true';
      return result;
    }
  }
  return trimmedUrl;
}

async function main() {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Goal' AND column_name = 'weekDays'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding weekDays column to Goal table...');
      await pool.query('ALTER TABLE "Goal" ADD COLUMN "weekDays" INTEGER[] DEFAULT \'{}\'');
      console.log('✓ Column weekDays added successfully');
    } else {
      console.log('✓ Column weekDays already exists');
    }
    
    // Update existing goals with null weekDays to empty array
    console.log('Normalizing existing goals...');
    const updateResult = await pool.query('UPDATE "Goal" SET "weekDays" = \'{}\' WHERE "weekDays" IS NULL');
    console.log(`✓ Normalized ${updateResult.rowCount} goals`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('\n✅ Migration complete!');
}

main();