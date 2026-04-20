export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@lib/prisma';
import type { GoalPayload } from '@types';
import { getServerSupabaseUser } from '@lib/supabase-server';

function normalizeGoalType(type: string) {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type;
}

export async function GET() {
  try {
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
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error fetching goals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else if (isServiceRole && serviceRoleAvailable) {
      userId = process.env.DEFAULT_USER_ID;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Additional check for TypeScript type narrowing
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as GoalPayload;
    const activatedAt = payload.activatedAt ? new Date(payload.activatedAt) : new Date();

    const existingGoal = await withRetry(() =>
      prisma.goal.findFirst({
        where: {
          userId: userId,
          title: payload.title
        }
      })
    );

    if (existingGoal) {
      const updatedGoal = await withRetry(() =>
        prisma.goal.update({
          where: { id: existingGoal.id },
          data: {
            description: payload.description,
            type: payload.type,
            icon: payload.icon ?? 'star',
            color: payload.color ?? 'slate',
            order: payload.order ?? existingGoal.order,
            pointsIfTrue: payload.pointsIfTrue,
            pointsIfFalse: payload.pointsIfFalse,
            pointsPerUnit: payload.pointsPerUnit,
            isActive: true,
            activatedAt,
            deactivatedAt: null
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
          title: payload.title,
          description: payload.description,
          type: payload.type,
          icon: payload.icon ?? 'star',
          color: payload.color ?? 'slate',
          order: payload.order ?? ((lastGoal?.order ?? -1) + 1),
          pointsIfTrue: payload.pointsIfTrue,
          pointsIfFalse: payload.pointsIfFalse,
          pointsPerUnit: payload.pointsPerUnit,
          isActive: true,
          activatedAt
        }
      })
    );

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error creating goal' }, { status: 500 });
  }
}
