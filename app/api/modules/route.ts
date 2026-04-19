export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseSession } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';
import { moduleDefinitions } from '@modules';

export async function GET() {
  const { user } = await getServerSupabaseUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  await Promise.all(
    moduleDefinitions.map((module) =>
      prisma.module.upsert({
        where: { slug: module.slug },
        create: {
          slug: module.slug,
          name: module.name,
          description: module.description,
          userId,
          active: false
        },
        update: {
          name: module.name,
          description: module.description
        }
      })
    )
  );

  const modules = await prisma.module.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  });

  const mapped = modules.map((module) => ({
    ...module,
    enabled: module.active
  }));

  return NextResponse.json(mapped);
}

export async function PATCH(request: Request) {
  const { user } = await getServerSupabaseUser();

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const payload = await request.json() as { slug: string; active: boolean };
  const moduleDefinition = moduleDefinitions.find((module) => module.slug === payload.slug);

  if (!moduleDefinition) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
  }

  const updatedModule = await prisma.module.upsert({
    where: { slug: payload.slug },
    create: {
      slug: payload.slug,
      name: moduleDefinition.name,
      description: moduleDefinition.description,
      userId,
      active: payload.active
    },
    update: {
      active: payload.active
    }
  });

  return NextResponse.json({
    ...updatedModule,
    enabled: updatedModule.active
  });
}
