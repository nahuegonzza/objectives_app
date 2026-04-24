export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { parseModuleConfig } from '@lib/modules';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const { active, config } = await request.json();

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (config !== undefined) updateData.config = JSON.stringify(config);

    const mod = await prisma.module.update({
      where: { id: params.moduleId },
      data: updateData,
    });

    return NextResponse.json({
      ...mod,
      config: parseModuleConfig(mod.config),
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json({ error: 'Error updating module' }, { status: 500 });
  }
}