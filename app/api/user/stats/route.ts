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

    // Count completed goals (GoalEntries with valueBoolean = true)
    const goalsCompleted = await prisma.goalEntry.count({
      where: {
        userId: userId,
        valueBoolean: true
      }
    });

    // Get total score from Score table
    const scoreResult = await prisma.score.aggregate({
      where: { userId: userId },
      _sum: { points: true }
    });

    const totalScore = Math.round(scoreResult._sum.points || 0);

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