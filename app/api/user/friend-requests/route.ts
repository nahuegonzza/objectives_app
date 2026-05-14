import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getServerSupabaseUser } from '@lib/supabase-server';

function buildUserSummary(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: `${user.firstName || user.name || ''} ${user.lastName || ''}`.trim() || user.username,
  };
}

export async function GET(request: Request) {
  const { user } = await getServerSupabaseUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const incomingRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING',
        sender: {
          blockedBy: { none: { blockerId: user.id } },
          blocks: { none: { blockedId: user.id } },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
      },
    });

    const outgoingRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: user.id,
        receiver: {
          blockedBy: { none: { blockerId: user.id } },
          blocks: { none: { blockedId: user.id } },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        receiver: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
      },
    });

    const acceptedRequests = await prisma.friendRequest.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
        sender: {
          blockedBy: { none: { blockerId: user.id } },
          blocks: { none: { blockedId: user.id } },
        },
        receiver: {
          blockedBy: { none: { blockerId: user.id } },
          blocks: { none: { blockedId: user.id } },
        },
      },
      include: {
        sender: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
        receiver: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
      },
    });

    const friends = acceptedRequests.map((request) => {
      return request.senderId === user.id
        ? buildUserSummary(request.receiver)
        : buildUserSummary(request.sender);
    });

    return NextResponse.json({
      friends,
      incomingRequests: incomingRequests.map((item) => ({
        id: item.id,
        sender: buildUserSummary(item.sender),
        createdAt: item.createdAt,
      })),
      outgoingRequests: outgoingRequests.map((item) => ({
        id: item.id,
        receiver: buildUserSummary(item.receiver),
        status: item.status,
        createdAt: item.createdAt,
      })),
      pendingIncomingCount: incomingRequests.length,
      pendingOutgoingCount: outgoingRequests.filter((item) => item.status === 'PENDING').length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener solicitudes de amistad' },
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
  const username = typeof body?.username === 'string' ? body.username.trim() : '';

  if (!username) {
    return NextResponse.json({ error: 'Nombre de usuario requerido' }, { status: 400 });
  }

  try {
    const target = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: { id: true, username: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (target.id === user.id) {
      return NextResponse.json({ error: 'No puedes enviarte una solicitud a ti mismo' }, { status: 400 });
    }

    const blockExists = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: target.id },
          { blockerId: target.id, blockedId: user.id },
        ],
      },
    });

    if (blockExists) {
      return NextResponse.json({ error: 'No puedes enviar una solicitud a este usuario' }, { status: 403 });
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: target.id },
          { senderId: target.id, receiverId: user.id },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json({ error: 'Ya existe una solicitud pendiente entre estos usuarios' }, { status: 409 });
      }
      if (existingRequest.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Ya son amigos' }, { status: 409 });
      }
      // Allow resending if previous request was DECLINED or CANCELLED
      if (existingRequest.status === 'DECLINED' || existingRequest.status === 'CANCELLED') {
        // Delete the old request and create a new one
        await prisma.friendRequest.delete({
          where: { id: existingRequest.id },
        });
      }
    }

    await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: target.id,
      },
    });

    return NextResponse.json({ message: 'Solicitud de amistad enviada' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al enviar solicitud' },
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
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const friendId = typeof body?.friendId === 'string' ? body.friendId.trim() : '';
  const action = body?.action;

  if (!['accept', 'decline', 'cancel', 'unfriend'].includes(action)) {
    return NextResponse.json({ error: 'Action válido es requerido' }, { status: 400 });
  }

  if (action !== 'unfriend' && !requestId) {
    return NextResponse.json({ error: 'requestId es requerido para esta acción' }, { status: 400 });
  }

  if (action === 'unfriend' && !friendId) {
    return NextResponse.json({ error: 'friendId es requerido para eliminar amistad' }, { status: 400 });
  }

  try {
    if (action === 'unfriend') {
      const existingFriend = await prisma.friendRequest.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { senderId: user.id, receiverId: friendId },
            { senderId: friendId, receiverId: user.id },
          ],
        },
      });

      if (!existingFriend) {
        return NextResponse.json({ error: 'No se encontró una amistad activa con este usuario' }, { status: 404 });
      }

      const unfriended = await prisma.friendRequest.update({
        where: { id: existingFriend.id },
        data: { status: 'CANCELLED' },
      });

      return NextResponse.json({ request: unfriended, message: 'Amigo eliminado' });
    }

    const existingRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
        receiver: {
          select: { id: true, username: true, firstName: true, lastName: true, name: true },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const isReceiver = existingRequest.receiverId === user.id;
    const isSender = existingRequest.senderId === user.id;

    if (action === 'accept' || action === 'decline') {
      if (!isReceiver) {
        return NextResponse.json({ error: 'Solo el receptor puede aceptar o rechazar la solicitud' }, { status: 403 });
      }
      if (existingRequest.status !== 'PENDING') {
        return NextResponse.json({ error: 'Solo solicitudes pendientes se pueden modificar' }, { status: 400 });
      }

      const updated = await prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
        },
      });

      return NextResponse.json({ request: updated });
    }

    if (action === 'cancel') {
      if (!isSender) {
        return NextResponse.json({ error: 'Solo el remitente puede cancelar la solicitud' }, { status: 403 });
      }
      if (existingRequest.status !== 'PENDING') {
        return NextResponse.json({ error: 'Solo solicitudes pendientes se pueden cancelar' }, { status: 400 });
      }

      const canceled = await prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
        },
      });

      return NextResponse.json({ request: canceled });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar solicitud' },
      { status: 500 }
    );
  }
}

