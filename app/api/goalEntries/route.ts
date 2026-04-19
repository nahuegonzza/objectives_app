export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import type { GoalEntryPayload } from '@types';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

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
  const date = new Date(year, month - 1, day); // local date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date created');
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeGoalType(type: string) {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');

  let whereClause: any = { userId: DEFAULT_USER };

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

  const entries = await prisma.goalEntry.findMany({
    where: whereClause,
    include: { goal: true },
    orderBy: { createdAt: 'desc' }
  });

  const normalized = entries.map((entry) => ({
    ...entry,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    goal: {
      ...entry.goal,
      type: normalizeGoalType(entry.goal.type)
    }
  }));

  return NextResponse.json(normalized);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as GoalEntryPayload;

  if (!payload.goalId || typeof payload.goalId !== 'string') {
    return NextResponse.json({ error: 'Invalid goalId' }, { status: 400 });
  }

  const entryDate = normalizeDateToStartOfDay(payload.date ?? new Date().toISOString());

  const goal = await prisma.goal.findUnique({ where: { id: payload.goalId } });
  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  const isNumeric = goal.type === 'NUMERIC' || goal.type === 'OBJECTIVE';
  const isBoolean = goal.type === 'BOOLEAN' || goal.type === 'HABIT';

  if (isBoolean && typeof payload.valueBoolean !== 'boolean') {
    return NextResponse.json({ error: 'valueBoolean must be a boolean for boolean goals' }, { status: 400 });
  }

  if (isNumeric && (typeof payload.value !== 'number' || isNaN(payload.value))) {
    return NextResponse.json({ error: 'value must be a valid number for numeric goals' }, { status: 400 });
  }

  const entryData: any = {
    userId: DEFAULT_USER,
    goalId: payload.goalId,
    date: entryDate,
    valueFloat: isNumeric ? payload.value ?? 0 : null,
    valueBoolean: isBoolean ? payload.valueBoolean ?? false : null
  };

  const existingEntry = await prisma.goalEntry.findFirst({
    where: { goalId: payload.goalId, date: entryDate }
  });

  const entry = existingEntry
    ? await prisma.goalEntry.update({
        where: { id: existingEntry.id },
        data: entryData,
        include: { goal: true }
      })
    : await prisma.goalEntry.create({
        data: entryData,
        include: { goal: true }
      });

  return NextResponse.json(
    {
      ...entry,
      date: entry.date.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      goal: {
        ...entry.goal,
        type: normalizeGoalType(entry.goal.type)
      }
    },
    { status: 201 }
  );
}
