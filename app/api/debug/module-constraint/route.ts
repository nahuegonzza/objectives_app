import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug disabled in production' }, { status: 404 });
  }

  const url = new URL(request.url);
  const fix = url.searchParams.get('fix') === 'true';

  try {
    const indexes: Array<{ indexname: string; indexdef: string }> = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'Module'
    `;

    const hasCompound = indexes.some((index) => index.indexname === 'Module_userId_slug_key');
    const hasGlobalSlug = indexes.some((index) => index.indexname === 'Module_slug_key');

    if (!fix) {
      return NextResponse.json({
        hasCompound,
        hasGlobalSlug,
        indexes,
        fixCommand: '/api/debug/module-constraint?fix=true'
      });
    }

    const results = [];
    if (hasGlobalSlug) {
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "Module_slug_key";
      `);
      results.push('Dropped Module_slug_key');
    }

    if (!hasCompound) {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "Module_userId_slug_key" ON "Module"("userId", "slug");
      `);
      results.push('Created Module_userId_slug_key');
    } else {
      results.push('Module_userId_slug_key already exists');
    }

    const refreshedIndexes: Array<{ indexname: string; indexdef: string }> = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'Module'
    `;

    return NextResponse.json({
      fixed: true,
      results,
      indexes: refreshedIndexes
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

