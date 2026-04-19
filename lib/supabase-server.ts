import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
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

export async function getServerSupabaseSession() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return {
    session: data?.session ?? null,
    supabase,
  };
}

export async function ensurePrismaUserForSession() {
  const { session } = await getServerSupabaseSession();
  const user = session?.user;

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

export async function getSupabaseUserId() {
  const { session } = await getServerSupabaseSession();
  return session?.user?.id ?? null;
}