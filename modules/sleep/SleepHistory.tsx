'use client';

import React from 'react';

interface SleepNap {
  start?: string;
  end?: string;
}

interface SleepHistoryProps {
  date: string;
  data: {
    bedtime?: string;
    waketime?: string;
    naps?: SleepNap[];
    hours?: number;
  };
}

export const SleepHistory: React.FC<SleepHistoryProps> = ({ date, data }) => {
  const bedtime = data?.bedtime || '';
  const waketime = data?.waketime || '';
  const naps: SleepNap[] = Array.isArray(data?.naps) ? data.naps : [];

  const totalHours = (() => {
    let total = Number(data?.hours || 0);
    if (!total) {
      if (bedtime && waketime) {
        const bed = new Date(`1970-01-01T${bedtime}:00`);
        const wake = new Date(`1970-01-01T${waketime}:00`);
        if (wake < bed) wake.setDate(wake.getDate() + 1);
        total += (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
      }
      for (const nap of naps) {
        if (!nap?.start || !nap?.end) continue;
        const napStart = new Date(`1970-01-01T${nap.start}:00`);
        const napEnd = new Date(`1970-01-01T${nap.end}:00`);
        const end = napEnd < napStart ? new Date(napEnd.setDate(napEnd.getDate() + 1)) : napEnd;
        total += (end.getTime() - napStart.getTime()) / (1000 * 60 * 60);
      }
    }
    return total;
  })();

  return (
    <div className="space-y-2 p-2">
      <div className="text-sm text-slate-900 dark:text-slate-100">
        Sueño: {bedtime || '-'} → {waketime || '-'}
      </div>
      {naps.length > 0 && (
        <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {naps.map((nap, index) => (
            <div key={index}>
              Siesta {index + 1}: {nap.start || '-'} → {nap.end || '-'}
            </div>
          ))}
        </div>
      )}
      <div className="text-sm text-slate-500 dark:text-slate-400">Total: {totalHours.toFixed(1)}h</div>
    </div>
  );
};
