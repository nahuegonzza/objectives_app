'use client';

import React from 'react';

interface SleepHistoryProps {
  date: string;
  data: any; // Adjust based on actual data structure
}

export const SleepHistory: React.FC<SleepHistoryProps> = ({ date, data }) => {
  // Assuming data has hours, bedtime, waketime
  const hours = data?.hours || 0;
  const bedtime = data?.bedtime || '';
  const waketime = data?.waketime || '';

  return (
    <div className="p-2">
      <span>Sueño: {bedtime} → {waketime} ({hours}h)</span>
    </div>
  );
};
