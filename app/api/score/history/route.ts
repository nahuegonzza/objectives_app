export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseUser } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';
import { calculateDailyScore } from '@core/score/scoreCalculator';
import { moduleDefinitions } from '@modules';
import { parseModuleConfig } from '@lib/modules';
import type { GoalEntryWithGoal, ActiveModule } from '@types';

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
  // Create date at start of day in UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

import type { GoalType } from '@types';

function normalizeGoalType(type: string): GoalType {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type as GoalType;
}

async function getEntriesForRange(start: Date, end: Date, userId: string) {
  const entries = await prisma.goalEntry.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { goal: true }
  });

  return entries.map((entry) => ({
    ...entry,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    goal: {
      ...entry.goal,
      type: normalizeGoalType(entry.goal.type),
      status: entry.goal.status as any,
      createdAt: entry.goal.createdAt.toISOString(),
      deactivatedAt: entry.goal.deactivatedAt ? entry.goal.deactivatedAt.toISOString() : null,
      activatedAt: entry.goal.activatedAt.toISOString()
    }
  })) as GoalEntryWithGoal[];
}

async function getEventsForRange(start: Date, end: Date, userId: string) {
  const events = await prisma.event.findMany({
    where: { userId, createdAt: { gte: start, lte: end } }
  });

  return events.map((event) => ({
    ...event,
    createdAt: event.createdAt.toISOString(),
    metadata: event.metadata ? JSON.parse(event.metadata) : {}
  }));
}

async function getModuleEntriesForRange(start: Date, end: Date, userId: string) {
  const entries = await prisma.moduleEntry.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: { module: true }
  });

  return entries.map((entry) => ({
    ...entry,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    data: entry.data,
    module: {
      ...entry.module,
      config: parseModuleConfig(entry.module.config),
      createdAt: entry.module.createdAt.toISOString()
    }
  }));
}

export async function GET(request: Request) {
  const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();

  let userId: string | undefined;
  if (user?.id) {
    userId = user.id;
  } else if (isServiceRole && serviceRoleAvailable) {
    userId = process.env.DEFAULT_USER_ID;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const reference = normalizeDateToStartOfDay(dateParam ?? new Date().toISOString());

  const currentStart = new Date(reference);
  const currentEnd = new Date(reference);
  currentEnd.setHours(23, 59, 59, 999);

  const previousDay = new Date(reference);
  previousDay.setDate(previousDay.getDate() - 1);
  const previousDayEnd = new Date(previousDay);
  previousDayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(reference);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date(reference);
  weekEnd.setDate(weekEnd.getDate() - 1);
  weekEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(reference);
  monthStart.setDate(monthStart.getDate() - 30);
  const monthEnd = new Date(reference);
  monthEnd.setDate(monthEnd.getDate() - 1);
  monthEnd.setHours(23, 59, 59, 999);

  const [todayEntries, previousDayEntries, weekEntries, monthEntries, todayEvents, previousDayEvents, weekEvents, monthEvents, todayModuleEntries, previousDayModuleEntries, weekModuleEntries, monthModuleEntries] = await Promise.all([
    getEntriesForRange(currentStart, currentEnd, userId),
    getEntriesForRange(previousDay, previousDayEnd, userId),
    getEntriesForRange(weekStart, weekEnd, userId),
    getEntriesForRange(monthStart, monthEnd, userId),
    getEventsForRange(currentStart, currentEnd, userId),
    getEventsForRange(previousDay, previousDayEnd, userId),
    getEventsForRange(weekStart, weekEnd, userId),
    getEventsForRange(monthStart, monthEnd, userId),
    getModuleEntriesForRange(currentStart, currentEnd, userId),
    getModuleEntriesForRange(previousDay, previousDayEnd, userId),
    getModuleEntriesForRange(weekStart, weekEnd, userId),
    getModuleEntriesForRange(monthStart, monthEnd, userId)
  ]);

  const dbModules = await prisma.module.findMany({
    where: { userId, active: true }
  });

  const activeModules: ActiveModule[] = dbModules.map((mod) => {
    const definition = moduleDefinitions.find((def) => def.slug === mod.slug);
    return {
      ...mod,
      config: parseModuleConfig(mod.config) || definition?.defaultConfig || {},
      definition,
      createdAt: mod.createdAt.toISOString(),
    } as ActiveModule;
  });

  const currentScore = calculateDailyScore(todayEntries, todayEvents, todayModuleEntries, activeModules);
  const previousDayScore = calculateDailyScore(previousDayEntries, previousDayEvents, previousDayModuleEntries, activeModules);
  const weekScore = calculateDailyScore(weekEntries, weekEvents, weekModuleEntries, activeModules);
  const monthScore = calculateDailyScore(monthEntries, monthEvents, monthModuleEntries, activeModules);

  return NextResponse.json({
    current: { ...currentScore, date: formatDate(currentStart) },
    previousDay: { ...previousDayScore, date: formatDate(previousDay) },
    previousWeek: { ...weekScore, date: `${formatDate(weekStart)} - ${formatDate(weekEnd)}` },
    previousMonth: { ...monthScore, date: `${formatDate(monthStart)} - ${formatDate(monthEnd)}` }
  });
}
