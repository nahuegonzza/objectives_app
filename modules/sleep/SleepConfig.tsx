'use client';

import React, { useState } from 'react';

interface SleepConfigProps {
  config: Record<string, unknown>;
  onSave: (newConfig: Record<string, unknown>) => void;
  onClose: () => void;
}

export const SleepConfig: React.FC<SleepConfigProps> = ({ config, onSave, onClose }) => {
  const [idealHours, setIdealHours] = useState(config.idealHours as number || 8);
  const [maxPoints, setMaxPoints] = useState(config.maxPoints as number || 2);
  const [penaltyMode, setPenaltyMode] = useState(config.penaltyMode as string || 'automatic');
  const [penaltyPerHour, setPenaltyPerHour] = useState(config.penaltyPerHour as number || 1);

  const handleSave = () => {
    onSave({
      idealHours,
      maxPoints,
      penaltyMode,
      penaltyPerHour,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Configuración de Sueño</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Horas ideales</label>
            <input
              type="number"
              value={idealHours}
              onChange={(e) => setIdealHours(Number(e.target.value))}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Puntos máximos</label>
            <input
              type="number"
              value={maxPoints}
              onChange={(e) => setMaxPoints(Number(e.target.value))}
              className="mt-1 block w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Modo de penalización</label>
            <select
              value={penaltyMode}
              onChange={(e) => setPenaltyMode(e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2"
            >
              <option value="automatic">Automática</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          {penaltyMode === 'manual' && (
            <div>
              <label className="block text-sm font-medium">Puntos a restar por hora</label>
              <input
                type="number"
                value={penaltyPerHour}
                onChange={(e) => setPenaltyPerHour(Number(e.target.value))}
                className="mt-1 block w-full border rounded px-3 py-2"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
};
