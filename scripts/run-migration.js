#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/prisma');

async function runMigration() {
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
}

runMigration();

