export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';
import { moduleDefinitions } from '@modules';

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

  // Ensure Prisma user exists
  if (user) {
    await ensurePrismaUserForSession();
  }

  for (const moduleDef of moduleDefinitions) {
    const existingModule = await prisma.module.findFirst({
      where: { userId, slug: moduleDef.slug }
    });

    if (!existingModule) {
      await prisma.module.create({
        data: {
          slug: moduleDef.slug,
          name: moduleDef.name,
          description: moduleDef.description,
          userId,
          active: false
        }
      });
    } else {
      await prisma.module.update({
        where: { id: existingModule.id },
        data: {
          name: moduleDef.name,
          description: moduleDef.description
        }
      });
    }
  }

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

  const payload = await request.json() as { slug: string; active: boolean };
  const moduleDefinition = moduleDefinitions.find((module) => module.slug === payload.slug);

  if (!moduleDefinition) {
    return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
  }

  const existingModule = await prisma.module.findFirst({
    where: { userId, slug: payload.slug }
  });

  let updatedModule;
  if (existingModule) {
    updatedModule = await prisma.module.update({
      where: { id: existingModule.id },
      data: {
        active: payload.active
      }
    });
  } else {
    updatedModule = await prisma.module.create({
      data: {
        slug: payload.slug,
        name: moduleDefinition.name,
        description: moduleDefinition.description,
        userId,
        active: payload.active
      }
    });
  }

  return NextResponse.json({
    ...updatedModule,
    enabled: updatedModule.active
  });
}
