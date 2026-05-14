export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@lib/prisma';
import type { GoalEntryPayload } from '@types';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { GoalEntryPayloadSchema } from '@lib/validators';

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

function normalizeGoalType(type: string) {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type;
}

export async function GET(request: Request) {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    // ❌ NO fallback a usuario por defecto
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const allParam = url.searchParams.get('all');

    let whereClause: any = { userId: userId };
    // Por defecto, solo cargar entradas de los últimos 30 días para mejorar performance
    // Pero si se pide 'all=true', cargar todas las entradas
    if (!dateParam && (!allParam || allParam !== 'true')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
      whereClause.date = { gte: thirtyDaysAgo };
    }
    if (dateParam) {
      try {
        const date = normalizeDateToStartOfDay(dateParam);
        const endOfDay = new Date(date);
        endOfDay.setUTCDate(endOfDay.getUTCDate() + 1); // Next day at start
        endOfDay.setUTCMilliseconds(-1); // End of the day
        whereClause.date = { gte: date, lte: endOfDay };
      } catch (error) {
        return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
      }
    }

    const entries = await withRetry(() =>
      prisma.goalEntry.findMany({
        where: whereClause,
        include: { goal: true },
        orderBy: { createdAt: 'desc' }
      })
    );

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
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    // ❌ NO fallback a usuario por defecto
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure Prisma user exists
    if (user) {
      await ensurePrismaUserForSession();
    }

    const payload = (await request.json()) as GoalEntryPayload;

    // Validate input
    const validationResult = GoalEntryPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedPayload = validationResult.data;

    if (!validatedPayload.goalId || typeof validatedPayload.goalId !== 'string') {
      return NextResponse.json({ error: 'Invalid goalId' }, { status: 400 });
    }

    const entryDate = normalizeDateToStartOfDay(validatedPayload.date ?? new Date().toISOString());

    const goal = await withRetry(() =>
      prisma.goal.findUnique({ where: { id: validatedPayload.goalId } })
    );
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const isNumeric = goal.type === 'NUMERIC' || goal.type === 'OBJECTIVE';
    const isBoolean = goal.type === 'BOOLEAN' || goal.type === 'HABIT';

    if (isBoolean && typeof validatedPayload.valueBoolean !== 'boolean') {
      return NextResponse.json({ error: 'valueBoolean must be a boolean for boolean goals' }, { status: 400 });
    }

    if (isNumeric && (typeof validatedPayload.value !== 'number' || isNaN(validatedPayload.value))) {
      return NextResponse.json({ error: 'value must be a valid number for numeric goals' }, { status: 400 });
    }

    const entryData: any = {
      userId: userId,
      goalId: validatedPayload.goalId,
      date: entryDate,
      valueFloat: isNumeric ? validatedPayload.value ?? 0 : null,
      valueBoolean: isBoolean ? validatedPayload.valueBoolean ?? false : null
    };

    const existingEntry = await withRetry(() =>
      prisma.goalEntry.findFirst({
        where: { goalId: validatedPayload.goalId, date: entryDate }
      })
    );

    const entry = existingEntry
      ? await withRetry(() =>
          prisma.goalEntry.update({
            where: { id: existingEntry.id },
            data: entryData,
            include: { goal: true }
          })
        )
      : await withRetry(() =>
          prisma.goalEntry.create({
            data: entryData,
            include: { goal: true }
          })
        );

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
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

