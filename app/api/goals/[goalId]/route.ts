export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@lib/prisma';
import type { GoalPayload } from '@types';
import { getServerSupabaseUser } from '@lib/supabase-server';
import { GoalPatchSchema, type ValidatedGoalPatch } from '@lib/validators';

export async function PATCH(request: Request, { params }: { params: { goalId: string } }) {
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

    const { goalId } = params;
    const rawPayload = (await request.json()) as Partial<GoalPayload> & { isActive?: boolean };
    const payload = {
      ...rawPayload,
      type: rawPayload.type === 'HABIT' ? 'BOOLEAN' : rawPayload.type === 'OBJECTIVE' ? 'NUMERIC' : rawPayload.type,
    };

    // Validate input
    const validationResult = GoalPatchSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedPayload: ValidatedGoalPatch = validationResult.data;

    const goal = await withRetry(() =>
      prisma.goal.findUnique({ where: { id: goalId } })
    );
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    
    // Only include fields that were provided and validated
    if (validatedPayload.title !== undefined) updateData.title = validatedPayload.title;
    if (validatedPayload.description !== undefined) updateData.description = validatedPayload.description;
    if (validatedPayload.type !== undefined) updateData.type = validatedPayload.type;
    if (validatedPayload.icon !== undefined) updateData.icon = validatedPayload.icon;
    if (validatedPayload.color !== undefined) updateData.color = validatedPayload.color;
    if (validatedPayload.order !== undefined) updateData.order = validatedPayload.order;
    if (validatedPayload.pointsIfTrue !== undefined) updateData.pointsIfTrue = validatedPayload.pointsIfTrue;
    if (validatedPayload.pointsIfFalse !== undefined) updateData.pointsIfFalse = validatedPayload.pointsIfFalse;
    if (validatedPayload.pointsPerUnit !== undefined) updateData.pointsPerUnit = validatedPayload.pointsPerUnit;
    if (validatedPayload.weekDays !== undefined) updateData.weekDays = validatedPayload.weekDays;

    if (typeof payload.isActive === 'boolean') {
      updateData.isActive = payload.isActive;
      if (payload.isActive === false) {
        updateData.deactivatedAt = new Date();
      } else if (payload.isActive === true) {
        updateData.deactivatedAt = null;
        updateData.activatedAt = new Date();
      }
    }

    if (validatedPayload.activatedAt) {
      updateData.activatedAt = new Date(validatedPayload.activatedAt);
    }

    const updatedGoal = await withRetry(() =>
      prisma.goal.update({
        where: { id: goalId },
        data: updateData
      })
    );

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { goalId: string } }) {
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

