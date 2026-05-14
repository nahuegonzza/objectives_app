export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@lib/prisma';
import type { GoalPayload } from '@types';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { GoalPayloadSchema, type ValidatedGoalPayload } from '@lib/validators';

function normalizeGoalType(type: string) {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type;
}

export async function GET() {
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

    const goals = await withRetry(() =>
      prisma.goal.findMany({
        where: { userId: userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
      })
    );

    const normalized = goals.map((goal) => ({
      ...goal,
      type: normalizeGoalType(goal.type)
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

    // Additional check for TypeScript type narrowing
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure Prisma user exists
    if (user) {
      await ensurePrismaUserForSession();
    }

    const payload = (await request.json()) as GoalPayload;

    // Validate input
    const validationResult = GoalPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedPayload: ValidatedGoalPayload = validationResult.data;

    const activatedAt = validatedPayload.activatedAt ? new Date(validatedPayload.activatedAt) : new Date();

    const existingGoal = await withRetry(() =>
      prisma.goal.findFirst({
        where: {
          userId: userId,
          title: validatedPayload.title
        }
      })
    );

    if (existingGoal) {
      const updatedGoal = await withRetry(() =>
        prisma.goal.update({
          where: { id: existingGoal.id },
          data: {
            description: validatedPayload.description,
            type: validatedPayload.type,
            icon: validatedPayload.icon ?? 'star',
            color: validatedPayload.color ?? 'slate',
            order: validatedPayload.order ?? existingGoal.order,
            pointsIfTrue: validatedPayload.pointsIfTrue,
            pointsIfFalse: validatedPayload.pointsIfFalse,
            pointsPerUnit: validatedPayload.pointsPerUnit,
            isActive: true,
            activatedAt,
            deactivatedAt: null,
            weekDays: validatedPayload.weekDays ?? []
          }
        })
      );

      return NextResponse.json(updatedGoal, { status: 200 });
    }

    const lastGoal = await withRetry(() =>
      prisma.goal.findFirst({
        where: { userId: userId },
        orderBy: { order: 'desc' }
      })
    );

    const goal = await withRetry(() =>
      prisma.goal.create({
        data: {
          userId: userId,
          title: validatedPayload.title,
          description: validatedPayload.description,
          type: validatedPayload.type,
          icon: validatedPayload.icon ?? 'star',
          color: validatedPayload.color ?? 'slate',
          order: validatedPayload.order ?? ((lastGoal?.order ?? -1) + 1),
          pointsIfTrue: validatedPayload.pointsIfTrue,
          pointsIfFalse: validatedPayload.pointsIfFalse,
          pointsPerUnit: validatedPayload.pointsPerUnit,
          isActive: true,
          activatedAt,
          weekDays: validatedPayload.weekDays ?? []
        }
      })
    );

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

