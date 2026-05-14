export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';
import { RulePayloadSchema, type ValidatedRulePayload } from '@lib/validators';

export async function GET() {
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

  const rules = await prisma.rule.findMany({
    where: { userId },
    orderBy: { priority: 'desc' }
  });

  const parsedRules = rules.map((rule) => ({
    ...rule,
    config: rule.config ? JSON.parse(rule.config) : {}
  }));

  return NextResponse.json(parsedRules);
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

    const payload = await request.json();

    // Validate input
    const validationResult = RulePayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedPayload: ValidatedRulePayload = validationResult.data;

    const rule = await prisma.rule.create({
      data: {
        userId,
        target: validatedPayload.target,
        condition: validatedPayload.condition,
        action: validatedPayload.action,
        priority: validatedPayload.priority,
        active: validatedPayload.active,
        config: JSON.stringify(validatedPayload.config ?? {})
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

