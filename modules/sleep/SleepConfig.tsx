'use client';

import React, { useMemo, useState } from 'react';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

interface SleepConfigProps {
  config: Record<string, unknown>;
  onSave: (newConfig: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}

export const SleepConfig: React.FC<SleepConfigProps> = ({ config, onSave, onClose }) => {
  const [idealHours, setIdealHours] = useState(config.idealHours as number || 8);
  const [maxPoints, setMaxPoints] = useState(config.maxPoints as number || 2);
  const [toleranceMinutes, setToleranceMinutes] = useState(config.toleranceMinutes as number || 30);
  const [penaltyMode, setPenaltyMode] = useState(config.penaltyMode as string || 'automatic');
  const [penaltyPerHour, setPenaltyPerHour] = useState(config.penaltyPerHour as number || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const initialConfig = useMemo(
    () => ({
      idealHours: config.idealHours as number || 8,
      maxPoints: config.maxPoints as number || 2,
      toleranceMinutes: config.toleranceMinutes as number || 30,
      penaltyMode: config.penaltyMode as string || 'automatic',
      penaltyPerHour: config.penaltyPerHour as number || 1,
    }),
    [config]
  );
  const isDirty = JSON.stringify({ idealHours, maxPoints, toleranceMinutes, penaltyMode, penaltyPerHour }) !== JSON.stringify(initialConfig);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const success = await onSave({
        idealHours,
        maxPoints,
        toleranceMinutes,
        penaltyMode,
        penaltyPerHour,
      });
      if (success) {
        onClose();
      } else {
        setError('No se pudo guardar la configuración.');
      }
    } catch (err) {
      setError('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Modal: En móvil se pega abajo como un "Action Sheet" */}
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Configurar Sueño
          </h2>
          <button onClick={() => {
            if (!isDirty) {
              onClose();
              return;
            }
            setShowUnsavedDialog(true);
          }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Ajusta tus objetivos de sueño.
        </p>

        <div className="space-y-5">
          {/* Horas ideales */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Horas ideales de sueño
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIdealHours(Math.max(1, idealHours - 0.5))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                -
              </button>
              <span className="text-3xl font-bold text-slate-900 dark:text-white w-16 text-center">
                {idealHours}
              </span>
              <button
                type="button"
                onClick={() => setIdealHours(Math.min(14, idealHours + 0.5))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                +
              </button>
              <span className="text-sm text-slate-500">horas</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              step="0.5"
              value={idealHours}
              onChange={(e) => setIdealHours(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-500"
            />
          </div>

          {/* Puntos máximos */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Puntos máximos por día
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMaxPoints(Math.max(1, maxPoints - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                -
              </button>
              <span className="text-3xl font-bold text-slate-900 dark:text-white w-16 text-center">
                {maxPoints}
              </span>
              <button
                type="button"
                onClick={() => setMaxPoints(Math.min(10, maxPoints + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                +
              </button>
              <span className="text-sm text-slate-500">puntos</span>
            </div>
          </div>

          {/* Minutos de tolerancia */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Minutos de tolerancia
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setToleranceMinutes(Math.max(0, toleranceMinutes - 5))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                -
              </button>
              <span className="text-3xl font-bold text-slate-900 dark:text-white w-16 text-center">
                {toleranceMinutes}
              </span>
              <button
                type="button"
                onClick={() => setToleranceMinutes(Math.min(120, toleranceMinutes + 5))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                +
              </button>
              <span className="text-sm text-slate-500">minutos</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={toleranceMinutes}
              onChange={(e) => setToleranceMinutes(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-500"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              No se penaliza hasta este rango alrededor de tu hora ideal.
            </p>
          </div>

          {/* Modo de penalización */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Modo de penalización
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPenaltyMode('automatic')}
                className={`rounded-lg py-3 px-4 text-sm font-semibold transition ${
                  penaltyMode === 'automatic'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                ⚡ Automático
              </button>
              <button
                type="button"
                onClick={() => setPenaltyMode('manual')}
                className={`rounded-lg py-3 px-4 text-sm font-semibold transition ${
                  penaltyMode === 'manual'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                ✏️ Manual
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {penaltyMode === 'automatic' 
                ? 'Los puntos se calculan automáticamente según las horas dormidas'
                : 'Define cuántos puntos se restan por cada hora bajo el objetivo'}
            </p>
          </div>

          {/* Puntos por hora (solo en manual) */}
          {penaltyMode === 'manual' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Puntos a restar por hora
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setPenaltyPerHour(Math.max(0.5, penaltyPerHour - 0.5))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-slate-900 dark:text-white w-16 text-center">
                  {penaltyPerHour}
                </span>
                <button
                  type="button"
                  onClick={() => setPenaltyPerHour(Math.min(5, penaltyPerHour + 0.5))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  +
                </button>
                <span className="text-sm text-slate-500">pts/hora</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              if (!isDirty) {
                onClose();
                return;
              }
              setShowUnsavedDialog(true);
            }}
            className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 active:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white">
            {error}
          </div>
        )}

        <UnsavedChangesModal
          open={showUnsavedDialog}
          onKeepEditing={() => setShowUnsavedDialog(false)}
          onDiscard={() => {
            setShowUnsavedDialog(false);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
