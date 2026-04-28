'use client';

import React from 'react';

interface MoodHistoryProps {
  date: string;
  data: any;
}

interface MoodState {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

const defaultStates: MoodState[] = [
  { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e' },
  { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6' },
  { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444' },
  { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b' },
  { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7' },
  { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4' },
];

export const MoodHistory: React.FC<MoodHistoryProps> = ({ date, data }) => {
  const moodId = data?.moodId;
  const states = data?.states || defaultStates;
  const mood = states.find((s: MoodState) => s.id === moodId) || defaultStates.find(s => s.id === moodId);

  if (!mood) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">{date}</p>
        <p className="text-slate-400">Sin registro</p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl border p-4 transition-all"
      style={{ 
        borderColor: mood.color + '40',
        backgroundColor: mood.color + '10'
      }}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-1">
        {date}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{mood.emoji}</span>
        <span 
          className="font-medium"
          style={{ color: mood.color }}
        >
          {mood.title}
        </span>
      </div>
    </div>
  );
};