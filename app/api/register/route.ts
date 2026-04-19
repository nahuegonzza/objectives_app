export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import bcrypt from 'bcryptjs';
import { validateEmail, validatePassword } from '@lib/validators';

function logError(context: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : '';
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] REGISTER ${context}:`, {
    message: errorMessage,
    stack: errorStack,
    env: process.env.NODE_ENV,
  });
  
  return errorMessage;
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [${requestId}] Registration request started`);

  try {
    let payload: Record<string, unknown> | null = null;
    const contentType = request.headers.get('content-type') ?? '';

    // Parse request body based on content type
    try {
      if (contentType.includes('application/json')) {
        payload = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        payload = {
          email: formData.get('email'),
          password: formData.get('password'),
          confirmPassword: formData.get('confirmPassword'),
        };
      } else {
        const bodyText = await request.text();
        payload = JSON.parse(bodyText);
      }
    } catch (parseError) {
      const msg = logError('PARSE_ERROR', parseError);
      return NextResponse.json(
        { error: 'Formato de solicitud inválido' },
        { status: 400 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'El cuerpo de la solicitud está vacío' },
        { status: 400 }
      );
    }

    // Extract and validate fields
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';
    const confirmPassword = typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';

    console.log(`[${timestamp}] [${requestId}] Validating input fields`);

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Email, contraseña y confirmación son obligatorios' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    console.log(`[${timestamp}] [${requestId}] Checking if user already exists`);

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        console.log(`[${timestamp}] [${requestId}] User already exists: ${email}`);
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado' },
          { status: 409 }
        );
      }
    } catch (dbError) {
      const msg = logError('FIND_USER_ERROR', dbError);
      return NextResponse.json(
        { error: 'Error al verificar el usuario. Por favor, intenta de nuevo.' },
        { status: 500 }
      );
    }

    console.log(`[${timestamp}] [${requestId}] Hashing password`);

    // Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (hashError) {
      const msg = logError('BCRYPT_ERROR', hashError);
      return NextResponse.json(
        { error: 'Error al procesar la contraseña. Por favor, intenta de nuevo.' },
        { status: 500 }
      );
    }

    console.log(`[${timestamp}] [${requestId}] Creating user in database`);

    // Create user
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });
    } catch (createError) {
      const msg = logError('CREATE_USER_ERROR', createError);
      
      // Check if it's a unique constraint error
      if (msg.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Este correo electrónico ya está registrado' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error al crear el usuario. Por favor, intenta de nuevo.' },
        { status: 500 }
      );
    }

    console.log(`[${timestamp}] [${requestId}] User created successfully: ${user.id}`);

    return NextResponse.json(
      {
        message: 'Usuario registrado correctamente',
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = logError('UNEXPECTED_ERROR', error);
    console.error(`[${timestamp}] [${requestId}] Unexpected error in registration endpoint`);
    
    return NextResponse.json(
      {
        error: 'Error inesperado del servidor. Por favor, intenta de nuevo más tarde.',
        ...(process.env.NODE_ENV === 'development' && { debug: msg }),
      },
      { status: 500 }
    );
  }
}
