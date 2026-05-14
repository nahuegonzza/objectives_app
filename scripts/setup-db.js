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
    // Verify Prisma schema exists
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Prisma schema not found at ' + schemaPath);
    }
    // Verify migrations folder exists
    const migrationsPath = path.join(__dirname, '..', 'prisma', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      throw new Error('Migrations folder not found');
    }
    // Generate Prisma Client
    execSync('npm run prisma:generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    // Test connection using Node (which works with pooler)
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
    await prisma.$disconnect();
  } catch (error) {
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
  } catch (error) {
    process.exit(1);
  }
}

setupDatabase();

