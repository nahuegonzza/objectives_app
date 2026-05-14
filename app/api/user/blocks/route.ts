import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser } from '@lib/supabase-server';

export async function GET() {
  const { user } = await getServerSupabaseUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const blockedRecords = await prisma.userBlock.findMany({
      where: { blockerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
      },
    });

    return NextResponse.json({
      blockedUsers: blockedRecords.map((record) => ({
        id: record.blocked.id,
        username: record.blocked.username,
        displayName: `${record.blocked.firstName || record.blocked.name || ''} ${record.blocked.lastName || ''}`.trim() || record.blocked.username,
        blockedAt: record.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al cargar usuarios bloqueados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { user } = await getServerSupabaseUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const blockedUserId = typeof body?.blockedUserId === 'string' ? body.blockedUserId.trim() : '';
  const username = typeof body?.username === 'string' ? body.username.trim() : '';

  if (!blockedUserId && !username) {
    return NextResponse.json({ error: 'blockedUserId o username requerido' }, { status: 400 });
  }

  try {
    const target = blockedUserId
      ? await prisma.user.findUnique({ where: { id: blockedUserId }, select: { id: true, username: true } })
      : await prisma.user.findFirst({
          where: { username: { equals: username, mode: 'insensitive' } },
          select: { id: true, username: true },
        });

    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (target.id === user.id) {
      return NextResponse.json({ error: 'No puedes bloquearte a ti mismo' }, { status: 400 });
    }

    const alreadyBlocked = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: target.id,
        },
      },
    });

    if (alreadyBlocked) {
      return NextResponse.json({ error: 'Usuario ya bloqueado' }, { status: 409 });
    }

    await prisma.friendRequest.updateMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: target.id },
          { senderId: target.id, receiverId: user.id },
        ],
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      data: { status: 'CANCELLED' },
    });

    await prisma.userBlock.create({
      data: {
        blockerId: user.id,
        blockedId: target.id,
      },
    });

    return NextResponse.json({ message: 'Usuario bloqueado correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al bloquear usuario' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { user } = await getServerSupabaseUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;
  const blockedUserId = typeof body?.blockedUserId === 'string' ? body.blockedUserId.trim() : '';

  if (action !== 'unblock' || !blockedUserId) {
    return NextResponse.json({ error: 'action válido y blockedUserId son requeridos' }, { status: 400 });
  }

  try {
    const existingBlock = await prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: blockedUserId,
        },
      },
    });

    if (!existingBlock) {
      return NextResponse.json({ error: 'Bloqueo no encontrado' }, { status: 404 });
    }

    await prisma.userBlock.delete({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: blockedUserId,
        },
      },
    });

    return NextResponse.json({ message: 'Usuario desbloqueado correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al desbloquear usuario' },
      { status: 500 }
    );
  }
}

