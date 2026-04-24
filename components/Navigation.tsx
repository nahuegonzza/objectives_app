'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';

const navItems: { href: string; icon: string; label: string }[] = [
  { href: '/', icon: '/navbar_icons/index_icon.png', label: 'Inicio' },
  { href: '/goals', icon: '/navbar_icons/goals_icon.png', label: 'Objetivos' },
  { href: '/calendar', icon: '/navbar_icons/calendar_icon.png', label: 'Calendario' },
  { href: '/analytics', icon: '/navbar_icons/analytics_icon.png', label: 'Analítica' },
  { href: '/profile', icon: '/navbar_icons/user_icon.png', label: 'Perfil' }
];

export default function Navigation() {
  const pathname = usePathname();
  const { session } = useSupabaseSession();
  const supabase = createBrowserSupabaseClient();
  const [userName, setUserName] = useState<string>('');
  const [todayStreakFulfilled, setTodayStreakFulfilled] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          const displayName = data.firstName || data.email;
          setUserName(displayName);
        })
        .catch(() => setUserName(session.user.email || 'Usuario'));
    }
  }, [session]);

  async function loadStreakInfo() {
    if (!session?.user) {
      return;
    }

    try {
      const res = await fetch('/api/streaks');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTodayStreakFulfilled(Boolean(data.todayFulfilled));
      setCurrentStreak(Number(data.currentStreak ?? 0));
    } catch (error) {
      console.error('Error loading streak info:', error);
    }
  }

  useEffect(() => {
    loadStreakInfo();
    const handleStreakUpdate = () => loadStreakInfo();
    window.addEventListener('streak-updated', handleStreakUpdate);
    return () => window.removeEventListener('streak-updated', handleStreakUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const isActivePath = (href: string) => {
    return pathname === href;
  };

  const getIconClasses = (href: string) => {
    const isActive = isActivePath(href);
    return isActive ? 'w-6 h-6 brightness-110' : 'w-6 h-6';
  };

  const getLinkClasses = (href: string) => {
    const isActive = isActivePath(href);
    return isActive
      ? 'rounded-xl border-2 border-emerald-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200'
      : 'rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800';
  };

  const [homeItem, ...otherItems] = navItems;
  const leftItems = [otherItems[1], otherItems[0]]; // calendar, goals
  const rightItems = otherItems.slice(2); // analytics, profile

  return (
    <>
      <nav className="hidden sm:block mb-4 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src={todayStreakFulfilled ? '/navbar_icons/streak_on.gif' : '/navbar_icons/streak_off.png'}
              alt={todayStreakFulfilled ? 'Racha cumplida hoy' : 'Racha incompleta hoy'}
              className="w-10 h-10 rounded-full"
            />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {currentStreak} día{currentStreak === 1 ? '' : 's'}
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="flex items-center justify-center">
              <img src="/image-no-background-500x500.png" alt="Goalyx Logo" className="w-10 h-10 object-contain" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href as any} className={getLinkClasses(item.href)} title={item.label}>
                <img src={item.icon} alt={item.label} className={getIconClasses(item.href)} />
              </Link>
            ))}
            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700 mx-1" />
            <Link href="/settings" className={getLinkClasses('/settings')} title="Ajustes">
              <img src="/navbar_icons/settings_icon.png" alt="Ajustes" className={getIconClasses('/settings')} />
            </Link>
          </div>
        </div>
      </nav>

      <nav className="sm:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 shadow-sm">
        <div className="relative mx-auto flex max-w-5xl items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <img
              src={todayStreakFulfilled ? '/navbar_icons/streak_on.gif' : '/navbar_icons/streak_off.png'}
              alt={todayStreakFulfilled ? 'Racha cumplida hoy' : 'Racha incompleta hoy'}
              className="w-10 h-10 rounded-full"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {currentStreak}
            </span>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <img src="/image-no-background-500x500.png" alt="Goalyx Logo" className="w-12 h-12" />
          </div>

          <Link href="/settings" title="Ajustes" className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActivePath('/settings') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} transition`}>
            <img src="/navbar_icons/settings_icon.png" alt="Ajustes" className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95 shadow-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            {leftItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActivePath(item.href) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} transition-transform duration-200`}
              >
                <img src={item.icon} alt={item.label} className={`${isActivePath(item.href) ? 'w-7 h-7' : 'w-6 h-6'}`} />
              </Link>
            ))}
          </div>

          <div className="relative -mt-4 flex items-center justify-center">
            <Link
              href={homeItem.href}
              title={homeItem.label}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-300 dark:border-slate-600 shadow-xl ${pathname === homeItem.href ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white' : 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'} transition-transform duration-200 hover:scale-105 hover:bg-slate-200 dark:hover:bg-slate-700`}
            >
              <img src={homeItem.icon} alt={homeItem.label} className={`${pathname === homeItem.href ? 'w-7 h-7 filter dark:filter-none' : 'w-6 h-6 filter dark:filter-none'}`} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {rightItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActivePath(item.href) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 scale-105' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} transition-transform duration-200`}
              >
                <img src={item.icon} alt={item.label} className={`${isActivePath(item.href) ? 'w-7 h-7' : 'w-6 h-6'}`} />
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
