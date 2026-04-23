'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@components/Navigation';
import ThemeToggle from '@components/ThemeToggle';
import ModuleTile from '@components/ModuleTile';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import type { Module } from '@types';

export default function SettingsPage() {
  const router = useRouter();
  const { session } = useSupabaseSession();
  const supabase = createBrowserSupabaseClient();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileStatus, setProfileStatus] = useState('');
  const [profileType, setProfileType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    async function loadModules() {
      try {
        const res = await fetch('/api/modules');
        if (!res.ok) throw new Error('Error loading modules');
        const data = await res.json();
        setModules(data);
      } catch (error) {
        console.error('Error loading modules:', error);
      } finally {
        setLoading(false);
      }
    }

    async function loadUser() {
      try {
        const res = await fetch('/api/user');
        if (!res.ok) throw new Error('Error loading user');
        const data = await res.json();
        setUser(data);
        
        // Parse name into firstName and lastName if they are not set
        let firstName = data.firstName || '';
        let lastName = data.lastName || '';
        if (!firstName && !lastName && data.name) {
          const parts = data.name.trim().split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }
        
        const birthDate = data.birthDate
          ? new Date(data.birthDate).toISOString().slice(0, 10)
          : (data.user_metadata?.birth_date || data.user_metadata?.birthDate || '');

        setProfileForm({
          firstName,
          lastName,
          birthDate,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setUserLoading(false);
      }
    }

    loadModules();
    loadUser();
  }, []);

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const [goalsRes, entriesRes, eventsRes, modulesRes, moduleEntriesRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/goalEntries'),
        fetch('/api/events'),
        fetch('/api/modules'),
        fetch('/api/moduleEntries')
      ]);

      if (!goalsRes.ok || !entriesRes.ok || !eventsRes.ok || !modulesRes.ok || !moduleEntriesRes.ok) {
        throw new Error('Error al exportar datos');
      }

      const data = {
        goals: await goalsRes.json(),
        entries: await entriesRes.json(),
        events: await eventsRes.json(),
        modules: await modulesRes.json(),
        moduleEntries: await moduleEntriesRes.json(),
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goalyx-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar datos: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleToggleModule = async (moduleId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setModules(modules.map(m => m.id === moduleId ? { ...m, active } : m));
      } else {
        throw new Error('Error toggling module');
      }
    } catch (error) {
      console.error('Error toggling module:', error);
      alert('Error al cambiar el módulo');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus('');
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          birthDate: profileForm.birthDate
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Error updating profile');
      }
      setProfileStatus('Perfil actualizado correctamente');
      setProfileType('success');
      // Reload user
      const updatedUser = await res.json();
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileStatus(error instanceof Error ? error.message : 'Error updating profile');
      setProfileType('error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus('');
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      setProfileStatus('Las contraseñas no coinciden');
      setProfileType('error');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Error changing password');
      }
      setProfileStatus('Contraseña cambiada correctamente');
      setProfileType('success');
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setProfileStatus(error instanceof Error ? error.message : 'Error changing password');
      setProfileType('error');
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Configuración</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Personaliza tu experiencia</p>
          </div>
          <Link href="/profile" className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </header>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Apariencia</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Modo oscuro</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Cambia entre tema claro y oscuro</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Perfil</h2>
            {userLoading ? (
              <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
            ) : user ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apellido</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu apellido"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha de nacimiento</label>
                      <input
                        type="date"
                        value={profileForm.birthDate}
                        onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition"
                  >
                    Actualizar Perfil
                  </button>
                </form>
                <form onSubmit={handleChangePassword} className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-white">Cambiar Contraseña</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraseña Actual</label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nueva Contraseña</label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold transition"
                  >
                    Cambiar Contraseña
                  </button>
                </form>
                {profileStatus && (
                  <p className={`text-sm font-medium ${profileType === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {profileStatus}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Error cargando perfil</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Módulos</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Activa módulos adicionales para funcionalidades extra</p>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {modules.map((module) => (
                  <ModuleTile
                    key={module.id}
                    module={module}
                    onToggle={handleToggleModule}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cuenta</h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold transition"
              >
                Cerrar Sesión
              </button>
              <button
                type="button"
                onClick={handleExportData}
                disabled={exportLoading}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 text-sm font-semibold transition"
              >
                {exportLoading ? 'Exportando...' : 'Exportar Datos JSON'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}