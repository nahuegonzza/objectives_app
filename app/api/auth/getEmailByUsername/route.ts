import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username')?.trim();

  if (!username) {
    return NextResponse.json({ error: 'Username requerido' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: { email: true, username: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      username: user.username
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener email' },
      { status: 500 }
    );
  }
}

