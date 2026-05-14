import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser } from '@lib/supabase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim();

  const { user } = await getServerSupabaseUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Busca al menos 2 caracteres' }, { status: 400 });
  }

  try {
    const results = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: 'insensitive',
        },
        id: {
          not: user.id,
        },
        blockedBy: {
          none: {
            blockerId: user.id,
          },
        },
        blocks: {
          none: {
            blockedId: user.id,
          },
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        name: true,
      },
      take: 10,
    });

    const filtered = results
      .filter((item) => item.id !== user.id)
      .map((item) => ({
        id: item.id,
        username: item.username,
        displayName: `${item.firstName || item.name || ''} ${item.lastName || ''}`.trim() || item.username,
      }));

    return NextResponse.json({ users: filtered });
  } catch (error) {
    console.error('Error searching users by username:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al buscar usuarios' },
      { status: 500 }
    );
  }
}
