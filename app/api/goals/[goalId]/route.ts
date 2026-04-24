export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import type { GoalPayload } from '@types';
import { getServerSupabaseUser } from '@lib/supabase-server';

export async function PATCH(request: Request, { params }: { params: { goalId: string } }) {
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

    const { goalId } = params;
    const payload = (await request.json()) as Partial<GoalPayload> & { isActive?: boolean };

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }

    const updateData: any = {
      title: payload.title,
      description: payload.description,
      type: payload.type,
      icon: payload.icon,
      color: payload.color,
      order: payload.order,
      pointsIfTrue: payload.pointsIfTrue,
      pointsIfFalse: payload.pointsIfFalse,
      pointsPerUnit: payload.pointsPerUnit,
      weekDays: payload.weekDays ?? []
    };

    if (typeof payload.isActive === 'boolean') {
      updateData.isActive = payload.isActive;
      if (payload.isActive === false) {
        updateData.deactivatedAt = new Date();
      } else if (payload.isActive === true) {
        updateData.deactivatedAt = null;
        updateData.activatedAt = new Date();
      }
    }

    if (payload.activatedAt) {
      updateData.activatedAt = new Date(payload.activatedAt);
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error updating goal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { goalId: string } }) {
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

    const { goalId } = params;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }

    if (goal.isActive !== false) {
      await prisma.goal.update({
        where: { id: goalId },
        data: {
          isActive: false,
          deactivatedAt: new Date()
        }
      });
      return NextResponse.json({ message: 'Objetivo desactivado' });
    }

    await prisma.goalEntry.deleteMany({ where: { goalId } });
    await prisma.goal.delete({ where: { id: goalId } });

    return NextResponse.json({ message: 'Objetivo eliminado permanentemente' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error deleting goal' }, { status: 500 });
  }
}

