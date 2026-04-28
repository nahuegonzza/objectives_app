export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser } from '@lib/supabase-server';

export async function GET() {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    let userId: string | undefined;

    if (user?.id) {
      userId = user.id;
    } else if (isServiceRole && serviceRoleAvailable) {
      userId = process.env.DEFAULT_USER_ID;
    } else {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no identificado' }, { status: 401 });
    }

    // Get all goal entries for this user to calculate total score
    const allEntries = await prisma.goalEntry.findMany({
      where: { userId: userId },
      include: { goal: true }
    });

    // Calculate total score from goal entries
    let totalScore = 0;
    for (const entry of allEntries) {
      const goal = entry.goal;
      if (!goal || goal.status !== 'ACTIVE') continue;
      
      const type = goal.type;
      if (type === 'BOOLEAN' || type === 'HABIT') {
        totalScore += entry.valueBoolean ? Number(goal.pointsIfTrue ?? 1) : Number(goal.pointsIfFalse ?? 0);
      } else if (type === 'NUMERIC' || type === 'OBJECTIVE') {
        totalScore += (entry.valueFloat ?? 0) * Number(goal.pointsPerUnit ?? 1);
      }
    }

    // Add module scores
    const moduleEntries = await prisma.moduleEntry.findMany({
      where: { userId: userId },
      include: { module: true }
    });

    // Simple module scoring - each module entry counts as 1 point
    // (Modules have their own scoring logic in their definitions)
    totalScore += moduleEntries.length;

    // Count completed goals (GoalEntries with valueBoolean = true)
    const goalsCompleted = allEntries.filter((entry) => entry.valueBoolean === true).length;

    return NextResponse.json({
      goalsCompleted,
      totalScore
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}