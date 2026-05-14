import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

export function createServiceRoleSupabaseClient() {
  // Read from env inside function to ensure latest values
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY in the environment.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// ✅ Función de autenticación - SIN fallback a service role
// Si no hay sesión válida, devuelve null (no usa usuario por defecto)
export async function getServerSupabaseUser() {
  const supabase = createServerSupabaseClient();

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return {
        user: null,
        supabase: null,
        isServiceRole: false,
        serviceRoleAvailable: false
      };
    }
    return {
      user: session.user,
      supabase,
      isServiceRole: false,
      serviceRoleAvailable: false
    };
  } catch (error) {
    return {
      user: null,
      supabase: null,
      isServiceRole: false,
      serviceRoleAvailable: false
    };
  }
}

// ✅ Prisma sync - Only create user if doesn't exist, never overwrite existing data
export async function ensurePrismaUserForSession() {
  const { user } = await getServerSupabaseUser();

  if (!user?.id || !user.email) {
    return null;
  }

  // Check if user already exists in database
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, firstName: true, lastName: true }
  });

  // If user exists, don't overwrite their profile data
  if (existingUser) {
    return existingUser;
  }

  // Only create new user if they don't exist
  const metadata = user.user_metadata as Record<string, any> | undefined;
  const firstName = (metadata?.first_name ?? metadata?.firstName) ?? null;
  const lastName = (metadata?.last_name ?? metadata?.lastName) ?? null;
  const birthDateValue = (metadata?.birth_date ?? metadata?.birthDate) ?? null;
  const birthDate = birthDateValue ? new Date(birthDateValue) : null;
  const name = metadata?.full_name ?? (([firstName, lastName].filter(Boolean).join(' ')) || null);

  return prisma.user.create({
    data: {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      // birthDate, // TODO: Uncomment after migration is applied
      name,
    },
  });
}

// ✅ helper simple
export async function getSupabaseUserId() {
  const { user } = await getServerSupabaseUser();
  return user?.id ?? null;
}
