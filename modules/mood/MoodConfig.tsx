'use client';

import React, { useState } from 'react';

interface MoodState {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

interface MoodConfigProps {
  config: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

const defaultStates: MoodState[] = [
  { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e' },
  { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6' },
  { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444' },
  { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b' },
  { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7' },
  { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4' },
];

// Emojis de caras disponibles
const availableEmojis = ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😌', '😍', '🥰', '😘', '😎', '🤩', '😇', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'];

// Colores disponibles
const availableColors = [
  '#22c55e', // verde
  '#3b82f6', // azul
  '#ef4444', // rojo
  '#f59e0b', // amarillo/naranja
  '#a855f7', // púrpura
  '#06b6d4', // cian
  '#ec4899', // rosa
  '#84cc16', // lima
  '#f97316', // naranja
  '#14b8a6', // teal
];

export const MoodConfig: React.FC<MoodConfigProps> = ({ config, onSave, onClose }) => {
  const [states, setStates] = useState<MoodState[]>(
    (config.states as MoodState[]) || defaultStates
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newColor, setNewColor] = useState('');

  const handleUpdateState = (id: string, field: keyof MoodState, value: string) => {
    setStates(states.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteState = (id: string) => {
    if (states.length <= 1) {
      alert('Debe haber al menos un estado');
      return;
    }
    setStates(states.filter(s => s.id !== id));
  };

  const handleAddState = () => {
    const id = `state_${Date.now()}`;
    setStates([...states, { id, title: 'Nuevo estado', emoji: '😐', color: '#6b7280' }]);
    setEditingId(id);
    setNewTitle('Nuevo estado');
    setNewEmoji('😐');
    setNewColor('#6b7280');
  };

  const handleSave = () => {
    onSave({
      ...config,
      states,
      maxPoints: config.maxPoints || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Configurar Estados
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Define los estados de ánimo disponibles. Cada estado tiene un título, emoji y color.
          </p>
        </div>

        <div className="space-y-3">
          {states.map((state) => (
            <div
              key={state.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl shrink-0"
                style={{ backgroundColor: state.color + '20' }}
              >
                {state.emoji}
              </div>
              
              <input
                type="text"
                value={state.title}
                onChange={(e) => handleUpdateState(state.id, 'title', e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-sm"
                placeholder="Título del estado"
              />

              {/* Controles en móvil: fila horizontal compacta */}
              <div className="flex items-center gap-1 justify-end shrink-0">
              {/* Selector de emoji */}
              <div className="relative">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-lg dark:border-slate-600"
                  onClick={() => setEditingId(editingId === state.id ? null : state.id)}
                >
                  {state.emoji}
                </button>
                
                {editingId === state.id && (
                  <div className="absolute right-0 top-12 z-10 max-h-48 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="grid grid-cols-6 gap-1">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            handleUpdateState(state.id, 'emoji', emoji);
                            setEditingId(null);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de color */}
              <div className="relative">
                <button
                  type="button"
                  className="h-9 w-9 rounded-full border-2 border-slate-300 dark:border-slate-600"
                  style={{ backgroundColor: state.color }}
                  onClick={() => setEditingId(editingId === state.id + '_color' ? null : state.id + '_color')}
                />
                
                {editingId === state.id + '_color' && (
                  <div className="absolute right-0 top-12 z-10 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="grid grid-cols-5 gap-1">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            handleUpdateState(state.id, 'color', color);
                            setEditingId(null);
                          }}
                          className="h-8 w-8 rounded-full border-2 border-transparent hover:border-slate-400"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDeleteState(state.id)}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                title="Eliminar estado"
              >
                🗑️
              </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddState}
          className="mt-4 w-full rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600 dark:border-slate-600 dark:hover:border-slate-500"
        >
          + Agregar estado
        </button>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};