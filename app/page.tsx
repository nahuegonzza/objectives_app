import { redirect } from 'next/navigation';
import { ensurePrismaUserForSession, getServerSupabaseSession } from '@lib/supabase-server';

export default async function Home() {
  const { user } = await getServerSupabaseUser();

  if (!user?.id) {
    redirect('/login');
  }

  await ensurePrismaUserForSession();

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Bienvenido, {session.user?.email}!
          </p>
        </div>
      </div>
    </main>
  );
}
