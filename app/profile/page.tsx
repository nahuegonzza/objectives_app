'use client';

import { useEffect, useState } from 'react';
import Navigation from '@components/Navigation';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import { getLocalDateString } from '@lib/dateHelpers';

export const dynamic = 'force-dynamic';

interface FriendSummary {
  id: string;
  username: string;
  displayName: string;
}

interface FriendRequestData {
  id: string;
  sender: FriendSummary;
  receiver?: FriendSummary;
  status?: string;
  createdAt: string;
}

function getDisplayName(user: any, loading: boolean, session: any) {
  if (loading) return 'Cargando...';
  if (!user) return 'Usuario';
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  if (fullName) return fullName;
  if (user.name) return user.name;
  return session?.user?.email || 'Usuario';
}

function calculateAge(birthDate?: string | Date | null) {
  if (!birthDate) return null;
  const date = typeof birthDate === 'string' ? new Date(birthDate + 'T12:00:00') : new Date(birthDate);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
}

export default function ProfilePage() {
  const { session } = useSupabaseSession();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ goalsCompleted: 0, totalScore: 0 });
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, longestStreak: 0, todayFulfilled: false, today: getLocalDateString() });

  useEffect(() => {
    if (!session?.user) return;
    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (!res.ok) throw new Error('Error loading user');
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
        if (session?.user) {
          setUserData({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || null,
            firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || null,
            lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || null,
            birthDate: null,
            createdAt: session.user.created_at,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    async function loadStats() {
      try {
        const res = await fetch('/api/user/stats', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setStats({ goalsCompleted: data.goalsCompleted || 0, totalScore: data.totalScore || 0 });
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    }
    loadStats();
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    async function loadStreakInfo() {
      try {
        const res = await fetch(`/api/streaks?date=${streakInfo.today}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setStreakInfo((prev) => ({
          ...prev,
          currentStreak: Number(data.currentStreak ?? 0),
          longestStreak: Number(data.longestStreak ?? 0),
          todayFulfilled: Boolean(data.todayFulfilled),
        }));
      } catch (error) {
        console.error('Error loading profile streak info:', error);
      }
    }
    loadStreakInfo();
  }, [session, streakInfo.today]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 text-slate-900 dark:text-white px-4 py-6 md:px-10 pb-24 sm:pb-0">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">Perfil Social</h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Tu espacio personal, estadísticas y conexiones.</p>
        </div>

        <div className="space-y-8">
          {/* Información Personal y Estadísticas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Principal - Info Personal */}
            <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-3xl p-8 shadow-lg text-white">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h2 className="text-3xl font-bold mb-1">{loading ? 'Cargando...' : getDisplayName(userData, loading, session)}</h2>
                <p className="text-blue-100 text-sm">@{userData?.username || 'sin_usuario'}</p>
                <p className="text-blue-100 text-xs mt-2">{userData?.email || 'No disponible'}</p>
                {calculateAge(userData?.birthDate) !== null && (
                  <p className="text-blue-100 text-xs mt-1">{calculateAge(userData?.birthDate)} años</p>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{stats.goalsCompleted}</p>
                <p className="text-sm mt-2 text-emerald-100">Objetivos</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{stats.totalScore}</p>
                <p className="text-sm mt-2 text-blue-100">Puntos</p>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{streakInfo.currentStreak}</p>
                <p className="text-sm mt-2 text-orange-100">Racha Actual</p>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{streakInfo.longestStreak}</p>
                <p className="text-sm mt-2 text-purple-100">Mejor Racha</p>
              </div>
            </div>
          </div>

          {/* Sección Social - Grid de 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Columna Izquierda - Búsqueda y Solicitudes */}
            <div className="space-y-6">
              {/* Búsqueda de Amigos */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Buscar Amigos</h2>
                </div>
                <FriendSearchPanel />
              </div>

              {/* Solicitudes Pendientes */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Solicitudes Entrantes</h2>
                </div>
                <PendingRequestsPanel />
              </div>
            </div>

            {/* Columna Derecha - Lista de Amigos */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tus Amigos</h2>
              </div>
              <FriendsListPanel />
            </div>
          </div>

          {/* Info Personal Expandida */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Información Personal</h2>
            {loading ? (
              <p className="text-slate-600 dark:text-slate-400">Cargando información...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wide">Nombre</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{getDisplayName(userData, loading, session)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 break-all">{userData?.email || 'No disponible'}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wide">Nacimiento</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{userData?.birthDate ? new Date(userData.birthDate).toISOString().slice(0, 10).split('-').reverse().join('/') : 'No registrada'}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase tracking-wide">Miembro desde</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }) : 'No disponible'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function FriendSearchPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<FriendSummary[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setMessage('');
    setResults([]);
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setMessage('Ingresa al menos 2 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/user/search?query=${encodeURIComponent(searchTerm.trim())}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Error al buscar');
      } else {
        setResults(data.users || []);
        if (!data.users?.length) setMessage('No se encontraron usuarios.');
      }
    } catch (error) {
      setMessage('Error al buscar usuario.');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (username: string) => {
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/user/friend-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Error al enviar');
      } else {
        setMessage('✅ Solicitud enviada.');
        setResults(results.filter((item) => item.username !== username));
      }
    } catch (error) {
      setMessage('Error al enviar solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-0 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
          placeholder="Escribe el username..."
        />
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60"
          disabled={loading}
        >
          Buscar
        </button>
      </div>

      {message && <p className={`text-sm font-medium ${message.startsWith('✅') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{message}</p>}

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((result) => (
            <div key={result.id} className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 border border-slate-200 dark:border-slate-600">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{result.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">@{result.username}</p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:from-emerald-600 hover:to-emerald-700"
                onClick={() => sendRequest(result.username)}
                disabled={loading}
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingRequestsPanel() {
  const [requests, setRequests] = useState<FriendRequestData[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/friend-requests', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Error al cargar');
      } else {
        setRequests(data.incomingRequests || []);
      }
    } catch (error) {
      setMessage('Error al cargar solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setMessage('');
    setLoading(true);
    try {
      const response = await fetch('/api/user/friend-requests', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Error al actualizar');
      } else {
        setRequests((prev) => prev.filter((item) => item.id !== requestId));
        setMessage(action === 'accept' ? '✅ Aceptado.' : '❌ Rechazado.');
      }
    } catch (error) {
      setMessage('Error al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>}
      {message && <p className={`text-sm font-medium ${message.startsWith('✅') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{message}</p>}
      {requests.length === 0 && !loading ? (
        <p className="text-slate-600 dark:text-slate-400 text-center py-6">No hay solicitudes pendientes</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 p-4 border-2 border-amber-200 dark:border-slate-600">
              <p className="font-semibold text-slate-900 dark:text-white">{request.sender.displayName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">@{request.sender.username}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:from-emerald-600 hover:to-emerald-700"
                  onClick={() => updateRequest(request.id, 'accept')}
                  disabled={loading}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
                  onClick={() => updateRequest(request.id, 'decline')}
                  disabled={loading}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FriendsListPanel() {
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadFriends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/friend-requests', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Error al cargar');
      } else {
        setFriends(data.friends || []);
      }
    } catch (error) {
      setMessage('Error al cargar amigos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>}
      {message && <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}
      {friends.length === 0 && !loading ? (
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">Aún no tienes amigos. ¡Comienza a conectar!</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {friends.map((friend) => (
            <div key={friend.id} className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 p-4 border-2 border-emerald-200 dark:border-slate-600 hover:shadow-md transition">
              <p className="font-semibold text-slate-900 dark:text-white">{friend.displayName}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">@{friend.username}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
