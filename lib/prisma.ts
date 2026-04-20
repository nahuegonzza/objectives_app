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

  if (/(supabase\.co|pooler\.supabase\.com)/.test(trimmedUrl) && !/[?&]sslmode=/.test(trimmedUrl)) {
    return trimmedUrl.includes('?') ? `${trimmedUrl}&sslmode=require` : `${trimmedUrl}?sslmode=require`;
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
  console.log('[Prisma] Initializing client with URL:', normalizedDatabaseUrl.substring(0, 50) + '...');

  // Configurar pool de PostgreSQL con opciones para conexiones móviles
  const poolConfig: PoolConfig = {
    connectionString: normalizedDatabaseUrl,
    // Configuraciones para mejor manejo de conexiones móviles
    connectionTimeoutMillis: 10000, // 10 segundos para conectar
    query_timeout: 15000, // 15 segundos para queries
    idleTimeoutMillis: 30000, // Cerrar conexiones idle después de 30s
    max: 5, // Máximo 5 conexiones
    min: 0, // Mínimo 0 conexiones
    allowExitOnIdle: true,
  };

  const prisma = new PrismaClient({
    adapter: new PrismaPg(poolConfig),
    errorFormat: 'pretty',
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Add connection event handlers
  prisma.$on('error', (e) => {
    console.error('[Prisma Error]', e);
  });

  // Mantener singleton en todos los entornos para evitar múltiples pools
  globalForPrisma.prisma = prisma;

  return prisma;
}

export const prisma = getPrismaClient();

// Función helper para retry automático en caso de errores de conexión
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Solo retry en errores de conexión
      if (!lastError.message.includes('Can\'t reach database server') &&
          !lastError.message.includes('DatabaseNotReachable')) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.log(`[Prisma] Retry attempt ${attempt + 1}/${maxRetries} after connection error`);
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }

  throw lastError!;
}
