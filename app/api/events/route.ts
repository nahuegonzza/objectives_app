export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';
import { moduleDefinitions } from '@modules';

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const date = url.searchParams.get('date');
  const type = url.searchParams.get('type');

  const where: any = { userId };
  if (date) {
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.createdAt = { gte: today, lt: tomorrow };
    } else {
      // Assume date is YYYY-MM-DD
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }
  }
  if (type) {
    where.type = type;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  const parsedEvents = events.map((event) => ({
    ...event,
    metadata: event.metadata ? JSON.parse(event.metadata) : {}
  }));

  return NextResponse.json(parsedEvents);
}

export async function POST(request: Request) {
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

  const payload = (await request.json()) as {
    type: string;
    value: number;
    moduleSlug: string;
    metadata?: Record<string, unknown>;
  };
  const moduleDefinition = moduleDefinitions.find((module) => module.slug === payload.moduleSlug);

  const eventData: any = {
    userId,
    type: payload.type,
    value: payload.value,
    metadata: JSON.stringify(payload.metadata ?? {})
  };

  if (moduleDefinition) {
    eventData.module = {
      connectOrCreate: {
        where: { slug: moduleDefinition.slug },
        create: { slug: moduleDefinition.slug, name: moduleDefinition.name, description: moduleDefinition.description, userId }
      }
    };
  }

  const event = await prisma.event.create({
    data: eventData
  });

  return NextResponse.json(event, { status: 201 });
}
