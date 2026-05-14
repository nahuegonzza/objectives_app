import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET() {
  try {
    // Test basic connection

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    // Try to count users
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: 'ok',
      message: 'Prisma connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: 'error',
      message: 'Prisma connection failed',
      error: errorMessage,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

