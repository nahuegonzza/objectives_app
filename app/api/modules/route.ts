export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { moduleDefinitions } from '@modules';

const DEFAULT_USER = process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export async function GET() {
  await Promise.all(
    moduleDefinitions.map((module) =>
      prisma.module.upsert({
        where: { slug: module.slug },
        create: {
          slug: module.slug,
          name: module.name,
          description: module.description,
          userId: DEFAULT_USER,
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
    where: { userId: DEFAULT_USER },
    orderBy: { name: 'asc' }
  });

  const mapped = modules.map((module) => ({
    ...module,
    enabled: module.active
  }));

  return NextResponse.json(mapped);
}

export async function PATCH(request: Request) {
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
      userId: DEFAULT_USER,
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
