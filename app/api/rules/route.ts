export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import type { Rule } from '@types';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export async function GET() {
  const rules = await prisma.rule.findMany({
    where: { userId: DEFAULT_USER },
    orderBy: { priority: 'desc' }
  });

  const parsedRules = rules.map((rule) => ({
    ...rule,
    config: rule.config ? JSON.parse(rule.config) : {}
  }));

  return NextResponse.json(parsedRules);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Rule;
  const rule = await prisma.rule.create({
    data: {
      userId: DEFAULT_USER,
      target: payload.target,
      condition: payload.condition,
      action: payload.action,
      priority: payload.priority ?? 0,
      active: payload.active ?? true,
      config: JSON.stringify(payload.config ?? {})
    }
  });
  return NextResponse.json(rule, { status: 201 });
}
