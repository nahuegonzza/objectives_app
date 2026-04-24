#!/usr/bin/env node
/**
 * Database setup script for Supabase with Prisma
 * This script uses the PrismaPg adapter which works with Supabase pooler
 * Use this instead of `prisma db push` when connecting through pgbouncer pooler
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  try {
    console.log('🔧 Starting database setup...\n');
    
    // Verify Prisma schema exists
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found at ' + schemaPath);
    }
    console.log('✓ Prisma schema found');

    // Verify migrations folder exists
    const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      throw new Error('Migrations folder not found');
    }
    console.log('✓ Migrations folder found');

    // Generate Prisma Client
    console.log('\n📦 Generating Prisma Client...');
    execSync('npm run prisma:generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✓ Prisma Client generated');

    // Test connection using Node (which works with pooler)
    console.log('\n🔌 Testing database connection...');
    const testScript = `
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable not set');
}

const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    const result = await prisma.$queryRaw\`SELECT 1 as test\`;
    console.log('✓ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
})();
`;
    
    const testFile = path.join(__dirname, 'test-connection.js');
    fs.writeFileSync(testFile, testScript);
    
    try {
      execSync(`node ${testFile}`, { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..'),
        env: Object.assign({}, process.env)
      });
    } finally {
      fs.unlinkSync(testFile);
    }

    console.log('\n✅ Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Your app will connect to Supabase PostgreSQL via the pooler');
    console.log('3. Migrations are managed in prisma/migrations/');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
