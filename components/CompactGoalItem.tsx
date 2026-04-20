'use client';

import { useEffect, useState } from 'react';
import type { Goal, GoalEntryWithGoal } from '@types';
import { getGoalIcon, COLOR_OPTIONS, getBackgroundColors } from '@lib/goalIconsColors';

interface CompactGoalItemProps {
  goal: Goal;
  entry?: GoalEntryWithGoal;
  isLoading?: boolean;
  onChange: (goal: Goal, value: boolean | number) => void;
}

export default function CompactGoalItem({ goal, entry, isLoading = false, onChange }: CompactGoalItemProps) {
  const colors = getBackgroundColors(goal.color);
  const icon = getGoalIcon(goal.icon);
  const currentValue = goal.type === 'BOOLEAN' ? entry?.valueBoolean ?? false : entry?.valueFloat ?? 0;
  const [inputValue, setInputValue] = useState<string>(Number(currentValue).toFixed(1));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(Number(currentValue).toFixed(1));
    }
  }, [currentValue, isFocused]);

  const commitValue = (raw: string) => {
    const normalized = raw.trim().replace(',', '.');
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      onChange(goal, parsed);
      setInputValue(String(parsed));
    } else {
      setInputValue(Number(currentValue).toFixed(1));
    }
  };

  const handleChange = (value: boolean | number) => {
    onChange(goal, value);
    if (goal.type !== 'BOOLEAN') {
      setInputValue(String(Number(value)));
    }
  };

  return (
    <div 
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:shadow-md dark:hover:shadow-lg group [background-color:var(--bg-light)] [border-color:var(--border-light)] dark:[background-color:var(--bg-dark)] dark:[border-color:var(--border-dark)]"
      style={{
        '--bg-light': colors.light,
        '--border-light': colors.lightBorder,
        '--bg-dark': colors.dark,
        '--border-dark': colors.darkBorder,
      } as React.CSSProperties & Record<string, string>}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate text-slate-900 dark:text-white">
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {goal.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {goal.type === 'BOOLEAN' ? (
          <button
            onClick={() => handleChange(!currentValue)}
            disabled={isLoading}
            className={`
              w-12 h-7 rounded-full transition-colors duration-200 relative
              ${Boolean(currentValue)
                ? 'bg-emerald-500 dark:bg-emerald-600'
                : 'bg-slate-300 dark:bg-slate-600'
              }
              disabled:opacity-50 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
            `}
            aria-label={`Toggle ${goal.title}`}
          >
            <span className={`
              absolute top-1 left-1 w-5 h-5 bg-white rounded-full
              transition-transform duration-200 shadow-sm
              ${Boolean(currentValue) ? 'translate-x-5' : 'translate-x-0'}
            `} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleChange(Number(inputValue) - 1)}
              disabled={isLoading}
              className="px-2 py-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-400 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              type="button"
            >
              −
            </button>
            <input
              type="number"
              step="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                setIsFocused(false);
                commitValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitValue(inputValue);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onWheel={(event) => {
                event.preventDefault();
                const normalized = inputValue.trim().replace(',', '.');
                const current = Number(normalized) || 0;
                const next = current + (event.deltaY < 0 ? 1 : -1);
                const value = Number.isNaN(next) ? 0 : next;
                setInputValue(String(value));
                commitValue(String(value));
              }}
              disabled={isLoading}
              className="w-20 px-2 py-1 text-center text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleChange(Number(inputValue) + 1)}
              disabled={isLoading}
              className="px-2 py-1 rounded bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold hover:bg-slate-400 dark:hover:bg-slate-600 disabled:opacity-50 transition"
            >
              +
            </button>
          </div>
        )}
        {isLoading && (
          <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            ...
          </span>
        )}
      </div>
    </div>
  );
}