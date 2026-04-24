'use client';

import { useEffect, useState } from 'react';
import Navigation from '@components/Navigation';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import { getLocalDateString } from '@lib/dateHelpers';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const { session } = useSupabaseSession();
  const supabase = createBrowserSupabaseClient();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ goalsCompleted: 0, totalScore: 0, streak: 0 });

  const calculateAge = (birthDate?: string | Date | null) => {
    if (!birthDate) return null;
    // Handle both string and Date objects
    const date = typeof birthDate === 'string'
      ? new Date(birthDate + 'T12:00:00')
      : new Date(birthDate);
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
    return age;
  };

  const getDisplayName = (user: any) => {
    if (loading) return 'Cargando...';
    if (!user) return 'Usuario';
    
    // Try to build full name from firstName and lastName
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (fullName) return fullName;
    
    // Fallback to name field
    if (user.name) return user.name;
    
    // Final fallback to email
    return session?.user?.email || 'Usuario';
  };

  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, longestStreak: 0, todayFulfilled: false, today: getLocalDateString() });

  useEffect(() => {
    if (session?.user) {
      setLoading(true);
      
      // Load user data with better error handling
      fetch('/api/user', { credentials: 'include' })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`HTTP ${res.status}: ${errorData.error || res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          setUserData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error loading user data:', error);
          // Fallback: use session data
          if (session?.user) {
            setUserData({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || null,
              firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || null,
              lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || null,
              birthDate: null,
              createdAt: session.user.created_at
            });
          }
          setLoading(false);
        });

      // Placeholder stats
      setStats({ goalsCompleted: 42, totalScore: 1250, streak: 7 });

      fetch(`/api/streaks?date=${streakInfo.today}`, { credentials: 'include' })
        .then((res) => res.ok ? res.json() : Promise.reject())
        .then((data) => {
          setStreakInfo((prev) => ({
            ...prev,
            currentStreak: Number(data.currentStreak ?? 0),
            longestStreak: Number(data.longestStreak ?? 0),
            todayFulfilled: Boolean(data.todayFulfilled)
          }));
        })
        .catch((error) => {
          console.error('Error loading profile streak info:', error);
        });
    }
  }, [session, streakInfo.today]);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Perfil</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Un vistazo a tu perfil social y estadísticas.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Información del Usuario */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Información Personal</h2>
              {loading ? (
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-400">Cargando información del perfil...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Nombre:</span> {getDisplayName(userData)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Email:</span> {userData?.email || session?.user?.email || 'No disponible'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Usuario:</span> {userData?.username || 'No establecido'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Fecha de nacimiento:</span> {userData?.birthDate ? new Date(userData.birthDate).toISOString().slice(0, 10).split('-').reverse().join('/') : 'No registrada'}
                  </p>
                  {calculateAge(userData?.birthDate) !== null && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Edad:</span> {calculateAge(userData?.birthDate)} años
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Miembro desde:</span> {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('es-ES') : 'No disponible'}
                  </p>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Estadísticas</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.goalsCompleted}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Objetivos Completados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalScore}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Puntuación Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{streakInfo.currentStreak}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Racha Actual</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{streakInfo.longestStreak}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Mejor Racha</p>
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

            {/* Racha diaria */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Racha diaria</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={streakInfo.todayFulfilled ? '/navbar_icons/streak_on.gif' : '/navbar_icons/streak_off.png'}
                      alt={streakInfo.todayFulfilled ? 'Racha cumplida hoy' : 'Racha incompleta hoy'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {streakInfo.todayFulfilled ? 'Racha cumplida hoy' : 'Racha incompleta hoy'}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{streakInfo.currentStreak} días</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={'/navbar_icons/streak_on.gif'}
                      alt={'Racha cumplida'}
                      className="w-10 h-10 rounded-full"
                    />                
                    <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Mejor racha registrada: {streakInfo.longestStreak} días
                    </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
