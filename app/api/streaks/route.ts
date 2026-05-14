export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';

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
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateKey(date: Date) {
  return formatDate(date);
}

function calculateStreaks(dateKeys: string[], referenceDate: string) {
  const uniqueDates = Array.from(new Set(dateKeys)).sort();
  let longestStreak = 0;
  let currentStreak = 0;

  let consecutive = 0;
  let prevDate: Date | null = null;

  uniqueDates.forEach((dateString) => {
    const currentDate = new Date(`${dateString}T00:00:00Z`);
    if (!prevDate) {
      consecutive = 1;
    } else {
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      consecutive = diffDays === 1 ? consecutive + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, consecutive);
    prevDate = currentDate;
  });

  const dateSet = new Set(uniqueDates);
  
  // Si hoy está registrado, contar desde hoy hacia atrás
  // Si hoy NO está pero ayer sí, contar desde ayer (racha salvable pero incompleta)
  // Si ayer tampoco está, racha rota (currentStreak = 0)
  let streakDate = new Date(`${referenceDate}T00:00:00Z`);
  
  // Si hoy no está en el set, retroceder un día para comenzar a contar desde ayer
  if (!dateSet.has(getDateKey(streakDate))) {
    streakDate.setUTCDate(streakDate.getUTCDate() - 1);
  }
  
  // Ahora contar hacia atrás desde donde estamos (hoy si está, ayer si no)
  while (dateSet.has(getDateKey(streakDate))) {
    currentStreak += 1;
    streakDate.setUTCDate(streakDate.getUTCDate() - 1);
  }

  return { currentStreak, longestStreak };
}

async function getStreakInfo(userId: string, referenceDate: string) {
  const rows = await prisma.$queryRaw<Array<{ date: Date }>>`
    SELECT date
    FROM "StreakDay"
    WHERE "userId" = ${userId}
    ORDER BY date ASC
  `;

  const dateKeys = rows.map((row) => formatDate(new Date(row.date)));
  const { currentStreak, longestStreak } = calculateStreaks(dateKeys, referenceDate);
  const todayFulfilled = dateKeys.includes(referenceDate);

  return { currentStreak, longestStreak, todayFulfilled, today: referenceDate };
}

export async function GET(request: Request) {
  const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
  // ❌ NO fallback a usuario por defecto
  let userId: string | undefined;

  if (user?.id) {
    userId = user.id;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const referenceDate = normalizeDateToStartOfDay(dateParam ?? formatDate(new Date()));
  const referenceDateKey = formatDate(referenceDate);

  try {
    const streakInfo = await getStreakInfo(userId!, referenceDateKey);
    return NextResponse.json(streakInfo);
  } catch (error) {
    return NextResponse.json({ error: 'Error loading streak info' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
  // ❌ NO fallback a usuario por defecto
  let userId: string | undefined;

  if (user?.id) {
    userId = user.id;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure Prisma user exists
  if (user) {
    await ensurePrismaUserForSession();
  }

  const body = await request.json();
  const dateParam = typeof body?.date === 'string' ? body.date : formatDate(new Date());
  let entryDate: Date;

  try {
    entryDate = normalizeDateToStartOfDay(dateParam);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  const entryDateKey = formatDate(entryDate);

  try {
    await prisma.$executeRaw`
      INSERT INTO "StreakDay" ("id", "userId", date, source, "createdAt")
      VALUES (${crypto.randomUUID()}, ${userId}, ${entryDate}, 'home', NOW())
      ON CONFLICT ("userId", date) DO NOTHING
    `;

    const streakInfo = await getStreakInfo(userId!, entryDateKey);
    return NextResponse.json(streakInfo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error saving streak day' }, { status: 500 });
  }
}

