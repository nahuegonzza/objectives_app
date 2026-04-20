const { execSync } = require('child_process');

const { DATABASE_URL, DIRECT_DATABASE_URL } = process.env;
const isPostgresUrl = (value) => typeof value === 'string' && /^(postgres|postgresql):\/\//i.test(value);
const isPoolerUrl = (value) => typeof value === 'string' && /pooler\.supabase\.com|:6543/.test(value);

if (!DIRECT_DATABASE_URL) {
  console.log('[prisma] DIRECT_DATABASE_URL is not set. Skipping prisma migrate deploy.');
  process.exit(0);
}

if (!isPostgresUrl(DIRECT_DATABASE_URL)) {
  console.log('[prisma] DIRECT_DATABASE_URL is not a PostgreSQL URL. Skipping prisma migrate deploy.');
  process.exit(0);
}

if (isPoolerUrl(DIRECT_DATABASE_URL)) {
  console.log('[prisma] DIRECT_DATABASE_URL appears to be a pooler URL. Skipping prisma migrate deploy.');
  process.exit(0);
}

if (DATABASE_URL && !isPostgresUrl(DATABASE_URL)) {
  console.log('[prisma] DATABASE_URL is not a PostgreSQL URL. Skipping prisma migrate deploy.');
  process.exit(0);
}

console.log('[prisma] DIRECT_DATABASE_URL found and validated. Running prisma migrate deploy...');

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (error) {
  console.error('[prisma] prisma migrate deploy failed.');
  process.exit(error.status || 1);
}
