export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { calculateDailyScore } from '@core/score/scoreCalculator';
import { moduleDefinitions } from '@modules';
import { parseModuleConfig } from '@lib/modules';
import type { GoalEntryWithGoal, ActiveModule } from '@types';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

function normalizeDateToStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

import type { GoalType } from '@types';

function normalizeGoalType(type: string): GoalType {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type as GoalType;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const today = dateParam ? new Date(dateParam) : new Date();

  const startOfDay = normalizeDateToStartOfDay(today);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const entries = await prisma.goalEntry.findMany({
    where: { userId: DEFAULT_USER, date: { gte: startOfDay, lte: endOfDay } },
    include: { goal: true }
  });

  const parsedEntries: GoalEntryWithGoal[] = entries.map((entry) => ({
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
  }));

  const events = await prisma.event.findMany({
    where: { userId: DEFAULT_USER, createdAt: { gte: startOfDay, lte: endOfDay } }
  });

  const parsedEvents = events.map((event) => ({
    ...event,
    createdAt: event.createdAt.toISOString(),
    metadata: event.metadata ? JSON.parse(event.metadata) : {}
  }));

  const moduleEntries = await prisma.moduleEntry.findMany({
    where: { userId: DEFAULT_USER, date: { gte: startOfDay, lte: endOfDay } },
    include: { module: true }
  });

  const parsedModuleEntries = moduleEntries.map((entry) => ({
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

  const score = calculateDailyScore(parsedEntries, parsedEvents, parsedModuleEntries, activeModules);
  return NextResponse.json(score);
}
