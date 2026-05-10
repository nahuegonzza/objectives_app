import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

function buildUsernameSuggestions(username: string, maxSuggestions = 3) {
  const suggestions: string[] = [];
  const tried = new Set<string>();
  const base = username;
  const suffixes = ['1', '123', '2026', '_', '_01', '0'];

  const addCandidate = (candidate: string) => {
    if (suggestions.length >= maxSuggestions) return;
    if (!tried.has(candidate) && candidate !== username) {
      tried.add(candidate);
      suggestions.push(candidate);
    }
  };

  for (const suffix of suffixes) {
    if (suggestions.length >= maxSuggestions) break;
    addCandidate(`${base}${suffix}`);
  }

  let counter = 2;
  while (suggestions.length < maxSuggestions && counter <= 100) {
    addCandidate(`${base}${counter}`);
    counter += 1;
  }

  return suggestions;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username')?.trim();
  const currentUsername = url.searchParams.get('currentUsername')?.trim();

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
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: { id: true }
    });

    const sameAsCurrent =
      currentUsername && username.toLowerCase() === currentUsername.toLowerCase();

    const available = !existingUser || sameAsCurrent;
    const response: any = {
      available,
      username
    };

    if (!available) {
      response.suggestions = buildUsernameSuggestions(username, 3);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al verificar username' },
      { status: 500 }
    );
  }
}
