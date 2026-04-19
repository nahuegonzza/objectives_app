export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import type { GoalPayload } from '@types';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export async function PATCH(request: Request, { params }: { params: { goalId: string } }) {
  const { goalId } = params;
  const payload = (await request.json()) as Partial<GoalPayload> & { isActive?: boolean };

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== DEFAULT_USER) {
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
    pointsPerUnit: payload.pointsPerUnit
  };

  // Si se intenta cambiar isActive
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
}

export async function DELETE(request: Request, { params }: { params: { goalId: string } }) {
  const { goalId } = params;

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== DEFAULT_USER) {
    return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  // Si está activo, hacer soft delete (marcar como inactivo)
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

  // Si ya está inactivo, hacer hard delete (eliminar permanentemente)
  await prisma.goalEntry.deleteMany({ where: { goalId } });
  await prisma.goal.delete({ where: { id: goalId } });

  return NextResponse.json({ message: 'Objetivo eliminado permanentemente' });
}

