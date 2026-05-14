'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navigation from '@components/Navigation';
import ThemeToggle from '@components/ThemeToggle';
import ModuleTile from '@components/ModuleTile';
import InfoModal from '@components/InfoModal';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import type { Module } from '@types';

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  blockedAt: string;
}

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseSession();
  const supabase = createBrowserSupabaseClient();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    birthDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalDescription, setInfoModalDescription] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [profileCollapsed, setProfileCollapsed] = useState(true);
  const [passwordCollapsed, setPasswordCollapsed] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (sessionLoading) return;

    async function loadModules() {
      try {
        const res = await fetch('/api/modules', { credentials: 'include' });
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
        const res = await fetch('/api/user', { credentials: 'include' });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        console.log('📥 Datos cargados desde API:', data);
        setUser(data);

        // Parse name into firstName and lastName if they are not set
        let firstName = data.firstName || '';
        let lastName = data.lastName || '';
        if ((!firstName || !lastName) && data.name) {
          const parts = data.name.trim().split(' ');
          firstName = firstName || parts[0] || '';
          lastName = lastName || parts.slice(1).join(' ') || '';
        }

        const birthDate = data.birthDate
          ? new Date(data.birthDate).toISOString().slice(0, 10)
          : '';

        const initialFormData = {
          firstName,
          lastName,
          username: data.username || '',
          birthDate,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        console.log('📝 Datos iniciales del formulario:', initialFormData);
        setProfileForm(initialFormData);
      } catch (error) {
        console.error('❌ Error loading user:', error);
        // Fallback: try to get basic info from session
        if (session?.user) {
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || null,
            firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || null,
            lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || null,
            birthDate: null
          };
          console.log('🔄 Usando datos de fallback:', fallbackUser);
          setUser(fallbackUser);

          const firstName = fallbackUser.firstName || '';
          const lastName = fallbackUser.lastName || '';
          const birthDate = '';

          const fallbackFormData = {
            firstName,
            lastName,
            username: '',
            birthDate,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };

          console.log('📝 Datos de fallback del formulario:', fallbackFormData);
          setProfileForm(fallbackFormData);
        }
      } finally {
        setUserLoading(false);
      }
    }

    loadModules();
    loadUser();
    loadBlockedUsers();
  }, [sessionLoading, session]);

  const [exportLoading, setExportLoading] = useState(false);

  const handleExportData = async () => {
    console.log('Iniciando exportación...');
    setExportLoading(true);
    try {
      const [goalsRes, entriesRes, eventsRes, modulesRes, moduleEntriesRes] = await Promise.all([
        fetch('/api/goals', { credentials: 'include' }),
        fetch('/api/goalEntries', { credentials: 'include' }),
        fetch('/api/events', { credentials: 'include' }),
        fetch('/api/modules', { credentials: 'include' }),
        fetch('/api/moduleEntries', { credentials: 'include' })
      ]);

      if (!goalsRes.ok || !entriesRes.ok || !eventsRes.ok || !modulesRes.ok || !moduleEntriesRes.ok) {
        throw new Error('Error al exportar datos');
      }

      const [goals, entries, events, modules, moduleEntries] = await Promise.all([
        goalsRes.json(),
        entriesRes.json(),
        eventsRes.json(),
        modulesRes.json(),
        moduleEntriesRes.json()
      ]);

      const data = {
        goals,
        entries,
        events,
        modules,
        moduleEntries,
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
      console.log('Exportación completada');
    } catch (error) {
      console.error('Export error:', error);
      setInfoModalTitle('Error al exportar datos');
      setInfoModalDescription(error instanceof Error ? error.message : 'Unknown error');
      setInfoModalOpen(true);
    } finally {
      setExportLoading(false);
    }
  };

  const handleToggleModule = async (moduleId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        credentials: 'include',
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
      setInfoModalTitle('Error al cambiar el módulo');
      setInfoModalDescription('No se pudo cambiar el estado del módulo. Intenta de nuevo.');
      setInfoModalOpen(true);
    }
  };

  const loadBlockedUsers = async () => {
    setBlockedLoading(true);
    try {
      const res = await fetch('/api/user/blocks', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setBlockedMessage(data?.error || 'Error al cargar usuarios bloqueados');
      } else {
        setBlockedUsers(data.blockedUsers || []);
      }
    } catch (error) {
      setBlockedMessage('Error al cargar usuarios bloqueados');
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    setBlockedLoading(true);
    setBlockedMessage('');
    try {
      const res = await fetch('/api/user/blocks', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock', blockedUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlockedMessage(data?.error || 'Error al desbloquear usuario');
      } else {
        setBlockedUsers((prev) => prev.filter((item) => item.id !== blockedUserId));
        setBlockedMessage('Usuario desbloqueado correctamente.');
      }
    } catch (error) {
      setBlockedMessage('Error al desbloquear usuario');
    } finally {
      setBlockedLoading(false);
    }
  };

  const checkUsernameAvailability = async (usernameValue: string) => {
    if (!usernameValue.trim()) {
      setUsernameAvailable(null);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(usernameValue.trim())) {
      setUsernameAvailable(false);
      return;
    }

    try {
      const currentUsernameParam = user?.username
        ? `&currentUsername=${encodeURIComponent(user.username)}`
        : '';
      const res = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(usernameValue.trim())}${currentUsernameParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setUsernameAvailable(data.available);
      } else {
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Validate that at least firstName or lastName is provided
    if (!profileForm.firstName.trim() && !profileForm.lastName.trim()) {
      setMessage('Debes proporcionar al menos un nombre o apellido');
      setMessageType('error');
      return;
    }

    // Debug: Log what we're sending
    const dataToSend = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      username: profileForm.username.trim() || null,
      birthDate: profileForm.birthDate || null
    };
    console.log('📤 Enviando datos del perfil:', dataToSend);

    // Validate username if provided
    if (profileForm.username.trim()) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(profileForm.username.trim())) {
        setMessage('El nombre de usuario debe tener 3-20 caracteres y solo contener letras, números, guiones y guiones bajos');
        setMessageType('error');
        return;
      }

      const normalizedUsername = profileForm.username.trim();
      const isSameAsCurrent = user?.username
        ? normalizedUsername.toLowerCase() === user.username.toLowerCase()
        : false;

      if (usernameAvailable === false && !isSameAsCurrent) {
        setMessage('Este nombre de usuario no está disponible');
        setMessageType('error');
        return;
      }
    }

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          username: profileForm.username.trim() || null,
          birthDate: profileForm.birthDate || null
        })
      });

      console.log('📥 Respuesta de la API:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Error de la API:', errorData);
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const updatedUser = await res.json();
      console.log('✅ Usuario actualizado:', updatedUser);

      setMessage('✓ Perfil actualizado');
      setMessageType('success');
      // Reload user
      setUser(updatedUser);

      // Update profile form with the data we just sent (not the response, to avoid null values)
      setProfileForm(prev => ({
        ...prev,
        firstName: dataToSend.firstName,
        lastName: dataToSend.lastName,
        birthDate: dataToSend.birthDate || prev.birthDate
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error instanceof Error ? error.message : 'Error updating profile');
      setMessageType('error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setMessageType('error');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
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
      setMessage('✓ Contraseña cambiada');
      setMessageType('success');
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage(error instanceof Error ? error.message : 'Error changing password');
      setMessageType('error');
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />
        <InfoModal
          open={infoModalOpen}
          title={infoModalTitle}
          description={infoModalDescription}
          onClose={() => setInfoModalOpen(false)}
        />

        {message && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message}
          </div>
        )}

        <header className="mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Configuración</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Personaliza tu experiencia</p>
          </div>
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

          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 overflow-hidden">
            <button
              type="button"
              onClick={() => setProfileCollapsed(!profileCollapsed)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Perfil</h2>
              <span className={`transform transition-transform ${profileCollapsed ? '' : 'rotate-90'} text-slate-500`}>▶</span>
            </button>
            {!profileCollapsed && (
              <div className="px-6 pb-6 space-y-6">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre de usuario</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, username: e.target.value });
                        checkUsernameAvailability(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="tunombredeusuario"
                    />
                    {profileForm.username && (
                      <div className="mt-1 text-sm">
                        {usernameAvailable === true && (
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Nombre de usuario disponible</span>
                        )}
                        {usernameAvailable === false && user.username !== profileForm.username && (
                          <span className="text-red-600 dark:text-red-400">✗ Nombre de usuario no disponible</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">3-20 caracteres, letras, números, guiones y guiones bajos</p>
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
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold transition"
                  >
                    Actualizar Perfil
                  </button>
                </form>
                {message && (
                  <p className={`text-sm font-medium ${messageType === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Error cargando perfil</p>
            )}
              </div>
            )}
          </div>

          {/* Cambiar Contraseña - sección separada */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 overflow-hidden">
            <button
              type="button"
              onClick={() => setPasswordCollapsed(!passwordCollapsed)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cambiar Contraseña</h2>
              <span className={`transform transition-transform ${passwordCollapsed ? '' : 'rotate-90'} text-slate-500`}>▶</span>
            </button>
            {!passwordCollapsed && (
              <div className="px-6 pb-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraseña Actual</label>
                    <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <Image
                        src={showCurrentPassword ? '/icons/ui/no_view_pass_icon.png' : '/icons/ui/view_pass_icon.png'}
                        alt={showCurrentPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        width={20}
                        height={20}
                        unoptimized
                      />
                    </button>
                  </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nueva Contraseña</label>
                    <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <Image
                        src={showNewPassword ? '/icons/ui/no_view_pass_icon.png' : '/icons/ui/view_pass_icon.png'}
                        alt={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        width={20}
                        height={20}
                        unoptimized
                      />
                    </button>
                  </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <Image
                        src={showConfirmPassword ? '/icons/ui/no_view_pass_icon.png' : '/icons/ui/view_pass_icon.png'}
                        alt={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                        width={20}
                        height={20}
                        unoptimized
                      />
                    </button>
                  </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold transition"
                  >
                    Cambiar Contraseña
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Usuarios Bloqueados</h2>
            {blockedLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando bloqueos...</p>}
            {blockedMessage && <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">{blockedMessage}</p>}
            {blockedUsers.length === 0 && !blockedLoading ? (
              <p className="text-slate-600 dark:text-slate-400">No tienes usuarios bloqueados.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {blockedUsers.map((blockedUser) => (
                  <div key={blockedUser.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{blockedUser.displayName}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">@{blockedUser.username}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold transition"
                        onClick={() => handleUnblockUser(blockedUser.id)}
                        disabled={blockedLoading}
                      >
                        Desbloquear
                      </button>
                    </div>
                  </div>
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
