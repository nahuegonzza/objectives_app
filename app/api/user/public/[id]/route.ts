export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@lib/prisma';
import { getServerSupabaseUser } from '@lib/supabase-server';
import { parseAcademicData } from '@modules/academic/academicHelpers';

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

  for (const dateString of uniqueDates) {
    const currentDate = new Date(`${dateString}T00:00:00Z`);
    if (!prevDate) {
      consecutive = 1;
    } else {
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      consecutive = diffDays === 1 ? consecutive + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, consecutive);
    prevDate = currentDate;
  }

  const dateSet = new Set(uniqueDates);
  let streakDate = new Date(`${referenceDate}T00:00:00Z`);
  if (!dateSet.has(getDateKey(streakDate))) {
    streakDate.setUTCDate(streakDate.getUTCDate() - 1);
  }

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
  return {
    currentStreak,
    longestStreak,
    todayFulfilled: dateKeys.includes(referenceDate),
    today: referenceDate,
  };
}

async function computePublicStats(userId: string) {
  const allEntries = await withRetry(() =>
    prisma.goalEntry.findMany({
      where: { userId },
      include: { goal: true },
    })
  );

  let totalScore = 0;
  let goalsCompleted = 0;

  for (const entry of allEntries) {
    const goal = entry.goal;
    if (!goal || goal.status !== 'ACTIVE') continue;

    if (entry.valueBoolean === true) {
      goalsCompleted += 1;
    }

    if (goal.type === 'BOOLEAN' || goal.type === 'HABIT') {
      totalScore += entry.valueBoolean ? Number(goal.pointsIfTrue ?? 1) : Number(goal.pointsIfFalse ?? 0);
    } else if (goal.type === 'NUMERIC' || goal.type === 'OBJECTIVE') {
      totalScore += (entry.valueFloat ?? 0) * Number(goal.pointsPerUnit ?? 1);
    }
  }

  const moduleEntries = await withRetry(() =>
    prisma.moduleEntry.findMany({
      where: { userId },
      include: { module: true },
    })
  );

  totalScore += moduleEntries.length;

  let moduleGoalsCompleted = 0;
  const moodEntries = moduleEntries.filter((entry) => entry.module.slug === 'mood');
  const sleepEntries = moduleEntries.filter((entry) => entry.module.slug === 'sleep');
  const academicEntries = moduleEntries.filter((entry) => entry.module.slug === 'academic');

  const moodDays = new Set(moodEntries.map((entry) => entry.date.toISOString().slice(0, 10)));
  moduleGoalsCompleted += moodDays.size;

  const sleepDays = new Set(sleepEntries.map((entry) => entry.date.toISOString().slice(0, 10)));
  moduleGoalsCompleted += sleepDays.size;

  for (const entry of academicEntries) {
    const data = parseAcademicData(entry.data);
    moduleGoalsCompleted += data.events.filter((event) => event.completed).length;
  }

  goalsCompleted += moduleGoalsCompleted;

  return { goalsCompleted, totalScore };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const targetId = params?.id;
    if (!targetId) {
      return NextResponse.json({ error: 'Id de usuario requerido' }, { status: 400 });
    }

    const { user } = await getServerSupabaseUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const friend = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: user.id, receiverId: targetId },
          { senderId: targetId, receiverId: user.id },
        ],
      },
    });

    if (!friend && targetId !== user.id) {
      return NextResponse.json({ error: 'No estás autorizado para ver este perfil' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        birthDate: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const stats = await computePublicStats(targetId);
    const streakInfo = await getStreakInfo(targetId, formatDate(new Date()));

    return NextResponse.json({
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        name: targetUser.name,
        birthDate: targetUser.birthDate ? targetUser.birthDate.toISOString().slice(0, 10) : null,
        createdAt: targetUser.createdAt ? targetUser.createdAt.toISOString() : null,
      },

      stats,
      streakInfo,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}
