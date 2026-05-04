'use client';

import React, { useState, useEffect } from 'react';
import UnifiedColorPicker from '@components/UnifiedColorPicker';

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

const availableEmojis = ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😌', '😍', '🥰', '😘', '😎', '🤩', '😇', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'];

export const MoodConfig: React.FC<MoodConfigProps> = ({ config, onSave, onClose }) => {
  const [states, setStates] = useState<MoodState[]>(
    (config.states as MoodState[]) || defaultStates
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdateState = (id: string, field: keyof MoodState, value: string) => {
    setStates(states.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteState = (id: string) => {
    if (states.length <= 1) return;
    setStates(states.filter(s => s.id !== id));
  };

  const handleAddState = () => {
    const id = `state_${Date.now()}`;
    setStates([...states, { id, title: '', emoji: '😐', color: '#6b7280' }]);
  };

  const handleSave = () => {
    onSave({ states, maxPoints: (config.maxPoints as number) || 1 });
    setMessage('✓ Configuración guardada');
    setMessageType('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Modal: En móvil se pega abajo como un "Action Sheet" */}
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Configurar Estados
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Personaliza tus estados de ánimo.
        </p>

        <div className="space-y-3">
          {states.map((state) => (
            <div
              key={state.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2 pr-3 dark:border-slate-700/50 dark:bg-slate-800/50"
            >
              {/* Emoji Picker Button (Unificado) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingId(editingId === state.id ? null : state.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl transition-transform active:scale-90"
                  style={{ backgroundColor: state.color + '20' }}
                >
                  {state.emoji}
                </button>
                
                {editingId === state.id && (
                  <div className="absolute left-0 top-12 z-20 max-h-52 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid grid-cols-6 gap-1">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            handleUpdateState(state.id, 'emoji', emoji);
                            setEditingId(null);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input de Título */}
              <input
                type="text"
                value={state.title}
                onChange={(e) => handleUpdateState(state.id, 'title', e.target.value)}
                className="flex-1 min-w-0 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200"
                placeholder="Nombre del estado..."
              />

              {/* Acciones Derecha */}
              <div className="flex items-center gap-2">
                {/* Color Picker */}
                <div className="min-w-[3rem]">
                  <UnifiedColorPicker
                    value={state.color}
                    onChange={(color) => handleUpdateState(state.id, 'color', color)}
                  />
                </div>

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => handleDeleteState(state.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddState}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-700"
        >
          <span>+</span> Agregar estado
        </button>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 active:bg-emerald-600"
          >
            Guardar
          </button>
        </div>

        {message && (
          <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
              messageType === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

// Icono simple para no depender de librerías externas
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);