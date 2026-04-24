'use client';

import { useTheme } from '@lib/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
      aria-label="Cambiar tema"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
