export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    let payload: Record<string, unknown> | null = null;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      try {
        payload = await request.json();
      } catch (parseError) {
        console.error('Registration error: invalid JSON', parseError);
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
      }
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      payload = {
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
      };
    } else {
      const bodyText = await request.text();
      try {
        payload = JSON.parse(bodyText);
      } catch (parseError) {
        console.error('Registration error: unable to parse body', parseError, bodyText);
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
      }
    }

    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload?.password === 'string' ? payload.password : '';
    const confirmPassword = typeof payload?.confirmPassword === 'string' ? payload.confirmPassword : '';

    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'Usuario creado correctamente', user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
