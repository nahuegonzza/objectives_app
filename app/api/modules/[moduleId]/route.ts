export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { parseModuleConfig } from '@lib/modules';
import { getServerSupabaseUser } from '@lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { user } = await getServerSupabaseUser();
    
    let userId: string | undefined;
    if (user?.id) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { active, config } = await request.json();

    // CRITICAL: Verify module belongs to the authenticated user
    const moduleRecord = await prisma.module.findUnique({
      where: { id: params.moduleId }
    });

    if (!moduleRecord || moduleRecord.userId !== userId) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (config !== undefined) {
      updateData.config = JSON.stringify(config);
    }

    const mod = await prisma.module.update({
      where: { id: params.moduleId },
      data: updateData,
    });

    const parsedConfig = parseModuleConfig(mod.config);

    return NextResponse.json({
      ...mod,
      config: parsedConfig,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}