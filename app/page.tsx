import { redirect } from 'next/navigation';
import { ensurePrismaUserForSession, getServerSupabaseUser } from '@lib/supabase-server';
import Navigation from '@components/Navigation';
import GoalTracker from '@components/GoalTracker';

export default async function Home() {
  const { user } = await getServerSupabaseUser();

  if (!user?.id) {
    redirect('/login');
  }

  try {
    await ensurePrismaUserForSession();
  } catch (error) {
    console.error('Prisma sync failed', error);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Inicio</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Bienvenido, {user?.email}!
          </p>
        </header>

        <div className="space-y-6">
          <GoalTracker />
        </div>
      </div>
    </main>
  );
}
