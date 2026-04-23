'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@components/Navigation';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';

export default function ProfilePage() {
  const { session } = useSupabaseSession();
  const supabase = createBrowserSupabaseClient();
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ goalsCompleted: 0, totalScore: 0, streak: 0 });

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => setUserData(data))
        .catch(() => setUserData({ firstName: 'Usuario', lastName: '', email: session.user.email }));

      // Placeholder stats
      setStats({ goalsCompleted: 42, totalScore: 1250, streak: 7 });
    }
  }, [session]);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Perfil</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Un vistazo a tu perfil social y estadísticas.</p>
          </div>
          <Link href="/settings" className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <img src="/navbar_icons/settings_icon.png" alt="Ajustes" className="w-6 h-6" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Información del Usuario */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Información Personal</h2>
              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Nombre:</span> {userData?.firstName + " " + userData?.lastName || 'Cargando...'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Email:</span> {userData?.email || ''}
                </p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Estadísticas</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.goalsCompleted}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Objetivos Completados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Puntuación Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.streak}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Racha Actual</p>
                </div>
              </div>
            </div>

            {/* Amigos */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Amigos</h2>
              <p className="text-slate-500 dark:text-slate-400">Próximamente: Conecta con otros usuarios y comparte tus logros.</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Amigo 1</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Racha: 5 días</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rachas con Amigos */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Rachas con Amigos</h2>
              <p className="text-slate-500 dark:text-slate-400">Próximamente: Compite y motiva a tus amigos.</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium text-slate-900 dark:text-white">Racha Compartida</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">12 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}