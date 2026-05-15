'use client';

import { useEffect, useState, useRef } from 'react';

interface FriendProfileModalProps {
  friendId: string;
  onClose: () => void;
  initialDisplayName?: string;
  initialUsername?: string;
}

interface FriendProfileData {
  id: string;
  username: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  birthDate?: string | null;
  createdAt?: string | null;
  stats: {
    goalsCompleted: number;
    totalScore: number;
    currentStreak: number;
    longestStreak: number;
  };
}

function getDisplayName(data: FriendProfileData | null, initialDisplayName?: string, initialUsername?: string) {
  if (!data) {
    return initialDisplayName || initialUsername || 'Usuario';
  }
  const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
  if (fullName) return fullName;
  if (data.name) return data.name;
  return data.username || initialUsername || 'Usuario';
}

function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;
  const date = new Date(birthDate + 'T12:00:00');
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
}

function formatShortDate(dateLike?: string | Date | null) {
  if (!dateLike) return '';
  let date: Date;
  if (typeof dateLike === 'string') {
    let dateStr = dateLike;
    if (dateLike.includes('T')) dateStr = dateLike.slice(0, 10);
    const safe = dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr;
    date = new Date(safe);
  } else {
    date = new Date(dateLike);
  }
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mon = months[date.getMonth()] + '.';
  const yyyy = date.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
}

export default function FriendProfileModal({ friendId, onClose, initialDisplayName, initialUsername }: FriendProfileModalProps) {
  const [friendData, setFriendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadFriend() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/user/public/${encodeURIComponent(friendId)}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data?.error || 'No se pudo cargar el perfil.');
          setFriendData(null);
        } else {
          if (data?.user && data?.stats) {
            setFriendData({
              ...data.user,
              stats: {
                goalsCompleted: data.stats.goalsCompleted ?? 0,
                totalScore: data.stats.totalScore ?? 0,
                currentStreak: data.streakInfo?.currentStreak ?? data.stats.currentStreak ?? 0,
                longestStreak: data.streakInfo?.longestStreak ?? data.stats.longestStreak ?? 0,
              },
            });
          } else {
            setFriendData(data.user ?? data);
          }
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido al cargar el perfil.');
        setFriendData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (friendId) {
      loadFriend();
    }
    return () => {
      mounted = false;
    };
  }, [friendId]);

  const displayName = getDisplayName(friendData, initialDisplayName, initialUsername);
  const age = calculateAge(friendData?.birthDate ?? null);
  const memberSince = friendData?.createdAt ? new Date(friendData.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No disponible';
  const stats = friendData?.stats ?? { goalsCompleted: 0, totalScore: 0, currentStreak: 0, longestStreak: 0 };

  const headerEmailRef = useRef<HTMLParagraphElement | null>(null);
  const infoEmailRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    function fitTextToWidth(el?: HTMLElement | null, initial = 14, min = 10) {
      if (!el) return;
      el.style.whiteSpace = 'nowrap';
      let size = initial;
      el.style.fontSize = `${size}px`;
      // allow one reflow loop
      while (el.scrollWidth > el.clientWidth && size > min) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    }

    const handle = () => {
      fitTextToWidth(headerEmailRef.current, 14, 10);
      fitTextToWidth(infoEmailRef.current, 14, 10);
    };

    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [friendData?.email]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Perfil de {displayName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            Cargando perfil...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-200">
            <p>{error}</p>
          </div>
        ) : friendData ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">{displayName}</h3>
                <p ref={headerEmailRef} title={friendData?.email || friendData?.username} className="text-blue-100 text-sm inline-block max-w-full">{friendData?.email || `@${friendData?.username}`}</p>
                {age !== null && <p className="text-blue-100 text-xs mt-1">{age} años</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{stats.goalsCompleted}</p>
                <p className="text-sm mt-2 text-emerald-100">Objetivos</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{stats.totalScore}</p>
                <p className="text-sm mt-2 text-blue-100">Puntos</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm mt-2 text-orange-100">Racha Actual</p>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 rounded-2xl p-6 shadow-md text-white">
                <p className="text-4xl font-bold">{stats.longestStreak}</p>
                <p className="text-sm mt-2 text-purple-100">Mejor Racha</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Información</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wide text-center">Nombre</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1 text-center">{displayName}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-wide text-center">Email</p>
                  <p ref={infoEmailRef} title={friendData?.email || ''} className="text-base font-bold text-slate-900 dark:text-white mt-1 text-center inline-block max-w-full whitespace-nowrap">{friendData?.email || 'No disponible'}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wide text-center">Nacimiento</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1 text-center">{friendData.birthDate ? formatShortDate(friendData.birthDate) : 'No disponible'}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-700">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase tracking-wide text-center">Miembro desde</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1 text-center">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
