export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import type { GoalPayload } from '@types';
import { getServerSupabaseSession } from '@lib/supabase-server';

function normalizeGoalType(type: string) {
  if (type === 'HABIT') return 'BOOLEAN';
  if (type === 'OBJECTIVE') return 'NUMERIC';
  return type;
}

export async function GET() {
  const { session } = await getServerSupabaseSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }]
  });

  const normalized = goals.map((goal) => ({
    ...goal,
    type: normalizeGoalType(goal.type)
  }));

  return NextResponse.json(normalized);
}

export async function POST(request: Request) {
  const { session } = await getServerSupabaseSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await request.json()) as GoalPayload;
  const activatedAt = payload.activatedAt ? new Date(payload.activatedAt) : new Date();

  // Buscar si ya existe un objetivo con el mismo título exacto
  const existingGoal = await prisma.goal.findFirst({
    where: {
      userId: session.user.id,
      title: payload.title
    }
  });

  if (existingGoal) {
    // Actualizar el objetivo existente
    const updatedGoal = await prisma.goal.update({
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
    });

    return NextResponse.json(updatedGoal, { status: 200 });
  }

  // Crear nuevo objetivo
  const lastGoal = await prisma.goal.findFirst({
    where: { userId: session.user.id },
    orderBy: { order: 'desc' }
  });

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
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
  });

  return NextResponse.json(goal, { status: 201 });
}
