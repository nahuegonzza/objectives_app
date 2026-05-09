export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { prisma, withRetry } from '@lib/prisma';
import { ModuleEntryPayloadSchema } from '@lib/validators';

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
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date created');
  }
  return date;
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

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    const mod = await withRetry(() =>
      prisma.module.findFirst({ where: { slug: moduleSlug, userId } })
    );
    if (mod) {
      whereClause.moduleId = mod.id;
    } else {
      return NextResponse.json([]);
    }
  }

  try {
    const entries = await withRetry(() =>
      prisma.moduleEntry.findMany({
        where: whereClause,
        include: { module: true },
        orderBy: { date: 'desc' }
      })
    );
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching module entries:', error);
    return NextResponse.json({ error: 'Failed to fetch module entries' }, { status: 500 });
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

    const body = await request.json();

    // Validate input
    const validationResult = ModuleEntryPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedPayload = validationResult.data;

    // CRITICAL: Verify module belongs to the authenticated user
    const moduleRecord = await withRetry(() =>
      prisma.module.findUnique({ where: { id: validatedPayload.moduleId } })
    );

    if (!moduleRecord || moduleRecord.userId !== userId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const normalizedDate = normalizeDateToStartOfDay(validatedPayload.date ?? new Date().toISOString().slice(0, 10));

    const entry = await withRetry(() =>
      prisma.moduleEntry.upsert({
        where: {
          moduleId_date: {
            moduleId: validatedPayload.moduleId,
            date: normalizedDate
          }
        },
        update: {
          data: JSON.stringify(validatedPayload.data),
          updatedAt: new Date()
        },
        create: {
          userId,
          moduleId: validatedPayload.moduleId,
          date: normalizedDate,
          data: JSON.stringify(validatedPayload.data)
        },
        include: { module: true }
      })
    );

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error saving module entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();

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
    const entryId = url.searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify the entry belongs to the user before deleting
    const entry = await withRetry(() =>
      prisma.moduleEntry.findFirst({
        where: { id: entryId, userId }
      })
    );

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await withRetry(() =>
      prisma.moduleEntry.delete({
        where: { id: entryId }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting module entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
