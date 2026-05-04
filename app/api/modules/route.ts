export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { getServerSupabaseUser, ensurePrismaUserForSession } from '@lib/supabase-server';
import { prisma } from '@lib/prisma';
import { moduleDefinitions } from '@modules';
import { parseModuleConfig } from '@lib/modules';

export async function GET() {
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

    for (const moduleDef of moduleDefinitions) {
      await prisma.module.upsert({
        where: { userId_slug: { userId, slug: moduleDef.slug } },
        create: {
          slug: moduleDef.slug,
          name: moduleDef.name,
          description: moduleDef.description,
          userId,
          active: false,
          config: JSON.stringify(moduleDef.defaultConfig || {})
        },
        update: {
          name: moduleDef.name,
          description: moduleDef.description
        }
      });
    }

    const modules = await prisma.module.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });

    const mapped = modules.map((module) => ({
      ...module,
      enabled: module.active,
      config: parseModuleConfig(module.config)
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error in /api/modules GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const payload = await request.json() as { slug: string; active: boolean };
    const moduleDefinition = moduleDefinitions.find((module) => module.slug === payload.slug);

    if (!moduleDefinition) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    const updatedModule = await prisma.module.upsert({
      where: { userId_slug: { userId, slug: payload.slug } },
      create: {
        slug: payload.slug,
        name: moduleDefinition.name,
        description: moduleDefinition.description,
        userId,
        active: payload.active,
        config: JSON.stringify(moduleDefinition.defaultConfig || {})
      },
      update: {
        active: payload.active
      }
    });

    return NextResponse.json({
      ...updatedModule,
      enabled: updatedModule.active,
      config: parseModuleConfig(updatedModule.config)
    });
  } catch (error) {
    console.error('Error in /api/modules PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
