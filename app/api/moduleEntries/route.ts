export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseSession } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';

function normalizeDateToStartOfDay(dateString: string) {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date string provided');
  }
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error('Date string must be in YYYY-MM-DD format');
  }
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error('Invalid date components');
  }
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date created');
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(request: Request) {
  const { user } = await getServerSupabaseUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const moduleSlug = url.searchParams.get('module');

  let whereClause: any = { userId };

  if (dateParam) {
    try {
      const date = normalizeDateToStartOfDay(dateParam);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = { gte: date, lte: endOfDay };
    } catch (error) {
      console.error('Error parsing date parameter:', dateParam, error);
      return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
    }
  }

  if (moduleSlug) {
    const module = await prisma.module.findFirst({
      where: { slug: moduleSlug, userId }
    });
    if (module) {
      whereClause.moduleId = module.id;
    } else {
      return NextResponse.json([]);
    }
  }

  try {
    const entries = await prisma.moduleEntry.findMany({
      where: whereClause,
      include: { module: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching module entries:', error);
    return NextResponse.json({ error: 'Failed to fetch module entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user } = await getServerSupabaseUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { moduleId, date, data } = body;

    if (!moduleId || !date || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedDate = normalizeDateToStartOfDay(date);

    const entry = await prisma.moduleEntry.upsert({
      where: {
        moduleId_date: {
          moduleId,
          date: normalizedDate
        }
      },
      update: {
        data: JSON.stringify(data),
        updatedAt: new Date()
      },
      create: {
        userId,
        moduleId,
        date: normalizedDate,
        data: JSON.stringify(data)
      },
      include: { module: true }
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error saving module entry:', error);
    return NextResponse.json({ error: 'Failed to save module entry' }, { status: 500 });
  }
}
