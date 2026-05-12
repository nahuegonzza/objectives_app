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
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorBody.error || res.statusText);
        }
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
        setStats({
          goalsCompleted: data.goalsCompleted || 0,
          totalScore: data.totalScore || 0,
        });
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
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Perfil</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Un vistazo a tu perfil social y estadísticas.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Información Personal</h2>
              {loading ? (
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-400">Cargando información del perfil...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Nombre:</span> {getDisplayName(userData, loading, session)}
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Buscar amigos</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-4">Busca por nombre de usuario y envía solicitudes de amistad.</p>
                <FriendSearchPanel />
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Solicitudes pendientes</h2>
                <PendingRequestsPanel />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Tus amigos</h2>
              <FriendsListPanel />
            </div>
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
      setMessage('Ingresa al menos 2 caracteres para buscar.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/user/search?query=${encodeURIComponent(searchTerm.trim())}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || 'Error al buscar usuarios');
      } else {
        setResults(data.users || []);
        if (!data.users?.length) {
          setMessage('No se encontraron usuarios con ese nombre.');
        }
      }
    } catch (error) {
      console.error('Error buscando usuario:', error);
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
        setMessage(data?.error || 'Error al enviar solicitud');
      } else {
        setMessage('Solicitud enviada correctamente.');
        setResults(results.filter((item) => item.username !== username));
      }
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      setMessage('Error al enviar solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="friend-search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de usuario</label>
        <div className="flex gap-2">
          <input
            id="friend-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700"
            placeholder="Buscar por username"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            Buscar
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{result.displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">@{result.username}</p>
              </div>
              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                onClick={() => sendRequest(result.username)}
                disabled={loading}
              >
                Enviar
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
        setMessage(data?.error || 'Error al cargar solicitudes');
      } else {
        setRequests(data.incomingRequests || []);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
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
        setMessage(data?.error || 'Error al actualizar solicitud');
      } else {
        setRequests((prev) => prev.filter((item) => item.id !== requestId));
        setMessage(action === 'accept' ? 'Solicitud aceptada.' : 'Solicitud rechazada.');
      }
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      setMessage('Error al actualizar solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando solicitudes...</p>}
      {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      {requests.length === 0 && !loading ? (
        <p className="text-slate-600 dark:text-slate-400">No tienes solicitudes entrantes pendientes.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-medium text-slate-900 dark:text-white">{request.sender.displayName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{request.sender.username}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  onClick={() => updateRequest(request.id, 'accept')}
                  disabled={loading}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
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
        setMessage(data?.error || 'Error al cargar amigos');
      } else {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error cargando amigos:', error);
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
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Cargando amigos...</p>}
      {message && <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}
      {friends.length === 0 && !loading ? (
        <p className="text-slate-600 dark:text-slate-400">Aún no tienes amigos aceptados. Envía una solicitud para comenzar a construir tu red.</p>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-medium text-slate-900 dark:text-white">{friend.displayName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{friend.username}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
