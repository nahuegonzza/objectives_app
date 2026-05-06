require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function normalizeDatabaseUrl(url) {
  if (!url) return url;
  let trimmedUrl = url.trim();
  if ((trimmedUrl.startsWith('"') && trimmedUrl.endsWith('"')) ||
      (trimmedUrl.startsWith("'") && trimmedUrl.endsWith("'"))) {
    trimmedUrl = trimmedUrl.slice(1, -1).trim();
  }
  trimmedUrl = trimmedUrl.replace(/;$/, '').trim();

  if (/pooler\.supabase\.com|:6543/.test(trimmedUrl)) {
    try {
      const urlObj = new URL(trimmedUrl);
      const params = urlObj.searchParams;
      if (!params.has('sslmode')) params.set('sslmode', 'require');
      if (!params.has('sslaccept')) params.set('sslaccept', 'accept_invalid_certs');
      if (!params.has('uselibpqcompat')) params.set('uselibpqcompat', 'true');
      urlObj.search = params.toString();
      return urlObj.toString();
    } catch {
      let result = trimmedUrl;
      if (!/[?&]sslmode=/.test(result)) {
        const separator = result.includes('?') ? '&' : '?';
        result += `${separator}sslmode=require`;
      }
      if (!/[?&]sslaccept=/.test(result)) {
        const separator = result.includes('?') ? '&' : '?';
        result += `${separator}sslaccept=accept_invalid_certs`;
      }
      if (!/[?&]uselibpqcompat=/.test(result)) {
        const separator = result.includes('?') ? '&' : '?';
        result += `${separator}uselibpqcompat=true`;
      }
      return result;
    }
  }

  if (/supabase\.co/.test(trimmedUrl) && !/[?&]sslmode=/.test(trimmedUrl)) {
    return trimmedUrl.includes('?')
      ? `${trimmedUrl}&sslmode=require`
      : `${trimmedUrl}?sslmode=require`;
  }

  return trimmedUrl;
}

const normalizedDatabaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

const poolConfig = {
  connectionString: normalizedDatabaseUrl,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  idleTimeoutMillis: 10000,
  max: 3,
  min: 0,
  allowExitOnIdle: true,
  statement_timeout: 10000,
};

const prisma = new PrismaClient({
  adapter: new PrismaPg(poolConfig),
  errorFormat: 'pretty',
});

async function check() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Module' OR table_name = 'module'
    `;
    console.log('Columns:', columns);

    const modules = await prisma.module.findMany();
    console.log('Total modules:', modules.length);
    console.log('Modules:', modules.map(m => ({
      slug: m.slug,
      active: m.active,
      userId: m.userId,
      order: m.order
    })));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();