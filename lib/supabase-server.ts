import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  );
}

export function createServerSupabaseClient(cookieStore = cookies()) {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/**
 * 🔐 Obtener usuario autenticado (FORMA CORRECTA)
 */
export async function getServerSupabaseUser() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return {
    user,
    supabase,
  };
}

/**
 * 👤 Sincroniza usuario con Prisma
 */
export async function ensurePrismaUserForSession() {
  const { user } = await getServerSupabaseUser();

  if (!user?.id || !user.email) {
    return null;
  }

  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name: (user.user_metadata as any)?.full_name ?? null,
    },
    create: {
      id: user.id,
      email: user.email,
      name: (user.user_metadata as any)?.full_name ?? null,
    },
  });
}

/**
 * 🆔 Obtener ID del usuario autenticado
 */
export async function getSupabaseUserId() {
  const { user } = await getServerSupabaseUser();
  return user?.id ?? null;
}