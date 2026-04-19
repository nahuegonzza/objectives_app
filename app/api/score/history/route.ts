export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { calculateDailyScore } from '@core/score/scoreCalculator';
import { moduleDefinitions } from '@modules';
import { parseModuleConfig } from '@lib/modules';
import type { GoalEntryWithGoal, ActiveModule } from '@types';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

function normalizeDateToStartOfDay(dateString: string) {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
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

async function getEntriesForRange(start: Date, end: Date) {
  const entries = await prisma.goalEntry.findMany({
    where: { userId: DEFAULT_USER, date: { gte: start, lte: end } },
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

async function getEventsForRange(start: Date, end: Date) {
  const events = await prisma.event.findMany({
    where: { userId: DEFAULT_USER, createdAt: { gte: start, lte: end } }
  });

  return events.map((event) => ({
    ...event,
    createdAt: event.createdAt.toISOString(),
    metadata: event.metadata ? JSON.parse(event.metadata) : {}
  }));
}

async function getModuleEntriesForRange(start: Date, end: Date) {
  const entries = await prisma.moduleEntry.findMany({
    where: { userId: DEFAULT_USER, date: { gte: start, lte: end } },
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
    getEntriesForRange(currentStart, currentEnd),
    getEntriesForRange(previousDay, previousDayEnd),
    getEntriesForRange(weekStart, weekEnd),
    getEntriesForRange(monthStart, monthEnd),
    getEventsForRange(currentStart, currentEnd),
    getEventsForRange(previousDay, previousDayEnd),
    getEventsForRange(weekStart, weekEnd),
    getEventsForRange(monthStart, monthEnd),
    getModuleEntriesForRange(currentStart, currentEnd),
    getModuleEntriesForRange(previousDay, previousDayEnd),
    getModuleEntriesForRange(weekStart, weekEnd),
    getModuleEntriesForRange(monthStart, monthEnd)
  ]);

  const dbModules = await prisma.module.findMany({
    where: { userId: DEFAULT_USER, active: true }
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
