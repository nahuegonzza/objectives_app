#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/prisma');

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
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
