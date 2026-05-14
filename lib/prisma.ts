import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PoolConfig } from 'pg';

const globalForPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
};

export function normalizeDatabaseUrl(url?: string) {
  if (!url) {
    return url;
  }

  let trimmedUrl = url.trim();

  if (
    (trimmedUrl.startsWith('"') && trimmedUrl.endsWith('"')) ||
    (trimmedUrl.startsWith("'") && trimmedUrl.endsWith("'"))
  ) {
    trimmedUrl = trimmedUrl.slice(1, -1).trim();
  }

  // Remove accidental trailing semicolon or whitespace
  trimmedUrl = trimmedUrl.replace(/;$/, '').trim();

  // Ensure SSL and libpq compatibility for pooler connections (port 6543 or pooler.supabase.com)
  if (/pooler\.supabase\.com|:6543/.test(trimmedUrl)) {
    try {
      const url = new URL(trimmedUrl);
      const params = url.searchParams;

      if (!params.has('sslmode')) {
        params.set('sslmode', 'require');
      }
      if (!params.has('sslaccept')) {
        params.set('sslaccept', 'accept_invalid_certs');
      }
      if (!params.has('uselibpqcompat')) {
        params.set('uselibpqcompat', 'true');
      }

      url.search = params.toString();
      return url.toString();
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

  // Regular Supabase direct connection
  if (/supabase\.co/.test(trimmedUrl) && !/[?&]sslmode=/.test(trimmedUrl)) {
    return trimmedUrl.includes('?') 
      ? `${trimmedUrl}&sslmode=require` 
      : `${trimmedUrl}?sslmode=require`;
  }

  return trimmedUrl;
}

const normalizedDatabaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (!normalizedDatabaseUrl) {
    throw new Error('Missing DATABASE_URL environment variable.');
  }

  process.env.DATABASE_URL = normalizedDatabaseUrl;

  // Configurar pool de PostgreSQL con opciones para conexiones móviles
  const poolConfig: PoolConfig = {
    connectionString: normalizedDatabaseUrl,
    connectionTimeoutMillis: 5000, // Reduced from 10s
    query_timeout: 10000, // Reduced from 15s
    idleTimeoutMillis: 10000, // Reduced from 30s (critical!)
    max: 5, // Increased slightly for better concurrent updates while keeping pool size low for serverless environments
    min: 0,
    allowExitOnIdle: true,
    statement_timeout: 10000,
  };

  const prisma = new PrismaClient({
    adapter: new PrismaPg(poolConfig),
    errorFormat: 'pretty',
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Add connection event handlers
  prisma.$on('error', (e) => {
  });

  // Mantener singleton en todos los entornos para evitar múltiples pools
  globalForPrisma.prisma = prisma;

  return prisma;
}

export const prisma = getPrismaClient();

// Función helper para retry automático en caso de errores de conexión
function isPrismaRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const retryablePatterns = [
    "Can't reach database server",
    'DatabaseNotReachable',
    'Connection terminated unexpectedly',
    'Connection refused',
    'ECONNRESET',
    'Connection pool error',
    'timeout',
    'Timed out',
    'Pool timed out',
    'failed to connect'
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 500
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!isPrismaRetryableError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError ?? new Error('Unknown Prisma error');
}

