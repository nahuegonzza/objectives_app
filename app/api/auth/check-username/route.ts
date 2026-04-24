import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username')?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: 'Username requerido' }, { status: 400 });
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return NextResponse.json({ available: false, error: 'Formato de username inválido' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { username: username },
      select: { id: true }
    });

    return NextResponse.json({
      available: !existingUser,
      username: username
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al verificar username' },
      { status: 500 }
    );
  }
}
