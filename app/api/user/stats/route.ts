export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@lib/prisma';
import { getServerSupabaseUser } from '@lib/supabase-server';
import { parseAcademicData } from '../../../../modules/academic/academicHelpers';

export async function GET() {
  try {
    const { user, isServiceRole, serviceRoleAvailable } = await getServerSupabaseUser();
    // ❌ NO fallback a usuario por defecto
    let userId: string | undefined;

    if (user?.id) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no identificado' }, { status: 401 });
    }

    // Get all goal entries for this user to calculate total score
    const allEntries = await withRetry(() =>
      prisma.goalEntry.findMany({
        where: { userId: userId },
        include: { goal: true }
      })
    );

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
    const moduleEntries = await withRetry(() =>
      prisma.moduleEntry.findMany({
        where: { userId: userId },
        include: { module: true }
      })
    );

    // Simple module scoring - each module entry counts as 1 point
    // (Modules have their own scoring logic in their definitions)
    totalScore += moduleEntries.length;

    // Count completed goals (GoalEntries with valueBoolean = true)
    let goalsCompleted = allEntries.filter((entry) => entry.valueBoolean === true).length;

    // Count module goals completed
    let moduleGoalsCompleted = 0;

    const moodEntries = moduleEntries.filter(e => e.module.slug === 'mood');
    const sleepEntries = moduleEntries.filter(e => e.module.slug === 'sleep');
    const academicEntries = moduleEntries.filter(e => e.module.slug === 'academic');

    // Unique days for mood
    const moodDays = new Set(moodEntries.map(e => e.date.toISOString().slice(0, 10)));
    moduleGoalsCompleted += moodDays.size;

    // Unique days for sleep
    const sleepDays = new Set(sleepEntries.map(e => e.date.toISOString().slice(0, 10)));
    moduleGoalsCompleted += sleepDays.size;

    // Completed academic events
    for (const entry of academicEntries) {
      const data = parseAcademicData(entry.data);
      moduleGoalsCompleted += data.events.filter(event => event.completed).length;
    }

    goalsCompleted += moduleGoalsCompleted;

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