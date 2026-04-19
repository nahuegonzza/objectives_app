export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { moduleDefinitions } from '@modules';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const date = url.searchParams.get('date');
  const type = url.searchParams.get('type');

  const where: any = { userId: DEFAULT_USER };
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
  const payload = (await request.json()) as {
    type: string;
    value: number;
    moduleSlug: string;
    metadata?: Record<string, unknown>;
  };
  const moduleDefinition = moduleDefinitions.find((module) => module.slug === payload.moduleSlug);

  const eventData: any = {
    userId: DEFAULT_USER,
    type: payload.type,
    value: payload.value,
    metadata: JSON.stringify(payload.metadata ?? {})
  };

  if (moduleDefinition) {
    eventData.module = {
      connectOrCreate: {
        where: { slug: moduleDefinition.slug },
        create: { slug: moduleDefinition.slug, name: moduleDefinition.name, description: moduleDefinition.description, userId: DEFAULT_USER }
      }
    };
  }

  const event = await prisma.event.create({
    data: eventData
  });

  return NextResponse.json(event, { status: 201 });
}
