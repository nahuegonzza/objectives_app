'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, useDragControls } from 'framer-motion';
import UnifiedColorPicker from '@components/UnifiedColorPicker';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

interface MoodState {
  id: string;
  title: string;
  emoji: string;
  color: string;
  points: number;
}

interface MoodConfigProps {
  config: Record<string, unknown>;
  onSave: (config: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}

const defaultStates: MoodState[] = [
  { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e', points: 1 },
  { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6', points: 1 },
  { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444', points: 1 },
  { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b', points: 1 },
  { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7', points: 1 },
  { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4', points: 1 },
];

const availableEmojis = ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😌', '😍', '🥰', '😘', '😎', '🤩', '😇', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'];

type MoodStateReorderItemProps = {
  state: MoodState;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onToggleEmojiEditor: (id: string) => void;
  onUpdateState: (id: string, field: keyof MoodState, value: string) => void;
  onDeleteState: (id: string) => void;
  editingId: string | null;
  emojiButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  emojiOverlayStyle: Record<string, number>;
  emojiOverlayRef: React.RefObject<HTMLDivElement>;
};

function MoodStateReorderItem({
  state,
  isDragging,
  onDragStart,
  onDragEnd,
  onToggleEmojiEditor,
  onUpdateState,
  onDeleteState,
  editingId,
  emojiButtonRefs,
  emojiOverlayStyle,
  emojiOverlayRef,
}: MoodStateReorderItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      key={state.id}
      value={state.id}
      layout={isDragging ? undefined : true}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 180, bounceDamping: 25, timeConstant: 20 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 18px 40px rgba(5, 150, 105, 0.18)' }}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-2 pr-3 dark:border-slate-700/50 dark:bg-slate-800/50"
    >
      <div className="relative shrink-0">
        <button
          type="button"
          ref={(el) => {
            emojiButtonRefs.current[state.id] = el;
          }}
          onClick={() => onToggleEmojiEditor(state.id)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl transition-transform active:scale-90"
          style={{ backgroundColor: state.color + '20' }}
        >
          {state.emoji}
        </button>

        {editingId === state.id && typeof document !== 'undefined' && createPortal(
          <div
            ref={emojiOverlayRef}
            className="fixed z-50 max-h-52 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            style={{
              top: emojiOverlayStyle.top,
              left: emojiOverlayStyle.left,
              width: emojiOverlayStyle.width,
            }}
          >
            <div className="grid grid-cols-6 gap-1">
              {availableEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onUpdateState(state.id, 'emoji', emoji);
                    onToggleEmojiEditor(state.id);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      <input
        type="text"
        value={state.title}
        onChange={(e) => onUpdateState(state.id, 'title', e.target.value)}
        className="flex-1 min-w-0 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200"
        placeholder="Nombre del estado..."
      />

      <input
        type="number"
        value={state.points}
        onChange={(e) => onUpdateState(state.id, 'points', e.target.value)}
        className="w-16 bg-transparent py-2 text-base font-medium text-slate-700 outline-none dark:text-slate-200 border border-slate-300 rounded px-2"
        placeholder="1"
        min="-10"
        max="10"
      />

      <div className="flex items-center gap-2">
        <div className="min-w-[3rem]">
          <UnifiedColorPicker
            value={state.color}
            onChange={(color) => onUpdateState(state.id, 'color', color)}
          />
        </div>
        <button
          type="button"
          onClick={() => onDeleteState(state.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <TrashIcon />
        </button>
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            onDragStart(state.id);
            dragControls.start(event, { snapToCursor: true });
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#059669] transition hover:border-[#059669] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 touch-none"
          aria-label="Arrastrar estado"
        >
          <span className="text-lg">≡</span>
        </button>
      </div>
    </Reorder.Item>
  );
}

export const MoodConfig: React.FC<MoodConfigProps> = ({ config, onSave, onClose }) => {
  const [states, setStates] = useState<MoodState[]>(
    (config.states as MoodState[]) || defaultStates
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draggingStateId, setDraggingStateId] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialStates = useMemo(() => ((config.states as MoodState[]) || defaultStates).map((state) => ({ ...state })), [config.states]);
  const isDirty = JSON.stringify(states) !== JSON.stringify(initialStates);
  const emojiButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const emojiOverlayRef = useRef<HTMLDivElement | null>(null);
  const [emojiOverlayStyle, setEmojiOverlayStyle] = useState<Record<string, number>>({});

  const handleUpdateState = (id: string, field: keyof MoodState, value: string) => {
    const updatedValue = field === 'points' ? parseInt(value) || 0 : value;
    setError('');
    setStates(states.map(s => s.id === id ? { ...s, [field]: updatedValue } : s));
  };

  const handleDeleteState = async (id: string) => {
    if (states.length <= 1) return;
    setError('');
    
    // Primero obtener todas las entradas del módulo mood
    try {
      const res = await fetch('/api/moduleEntries?module=mood', { credentials: 'include' });
      if (res.ok) {
        const entries = await res.json();
        
        // Filtrar entradas que usan el estado que se va a borrar
        const entriesToUpdate = entries.filter((entry: any) => {
          try {
            const data = JSON.parse(entry.data);
            return data.moodId === id;
          } catch {
            return false;
          }
        });
        
        // Actualizar cada entrada para quitar el estado seleccionado
        const updatePromises = entriesToUpdate.map((entry: any) =>
          fetch('/api/moduleEntries', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleId: entry.moduleId,
              date: entry.date.slice(0, 10), // Solo la fecha YYYY-MM-DD
              data: {} // Objeto vacío para quitar el estado seleccionado
            })
          })
        );
        
        // Esperar a que todas las actualizaciones se completen
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error('Error updating entries when deleting state:', error);
      // No fallar la operación si hay error actualizando entradas
    }
    
    // Finalmente, quitar el estado del array local
    setStates(states.filter(s => s.id !== id));
  };

  const reorderStatesById = (nextIds: string[]) => {
    return nextIds
      .map((id) => states.find((state) => state.id === id))
      .filter((state): state is MoodState => Boolean(state));
  };

  const handleStatesReorder = (nextIds: string[]) => {
    const reorderedStates = reorderStatesById(nextIds);
    setStates(reorderedStates);
  };

  const handleDragStartState = (id: string) => {
    setDraggingStateId(id);
  };

  const hasEmptyState = states.some(state => !state.title.trim());
  const canAddNewState = !hasEmptyState;

  const handleAddState = () => {
    if (!canAddNewState) {
      setError('Completa el estado pendiente antes de agregar uno nuevo.');
      return;
    }

    const id = `state_${Date.now()}`;
    setStates([...states, { id, title: '', emoji: '😐', color: '#6b7280', points: 1 }]);
  };

  useLayoutEffect(() => {
    if (!editingId) return;
    const button = emojiButtonRefs.current[editingId];
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const popupWidth = 256;
    const popupHeight = 220;
    const margin = 8;
    let top = rect.bottom + margin;
    if (top + popupHeight > window.innerHeight - margin) {
      top = rect.top - popupHeight - margin;
      if (top < margin) top = margin;
    }
    let left = rect.left;
    if (left + popupWidth > window.innerWidth - margin) {
      left = window.innerWidth - popupWidth - margin;
    }
    if (left < margin) left = margin;

    setEmojiOverlayStyle({ top, left, width: popupWidth });
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;

    const handleClickOutside = (event: MouseEvent) => {
      const button = emojiButtonRefs.current[editingId];
      if (!button) return;
      if (button.contains(event.target as Node)) return;
      if (emojiOverlayRef.current?.contains(event.target as Node)) return;
      setEditingId(null);
    };

    const updatePosition = () => {
      const button = emojiButtonRefs.current[editingId];
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const popupWidth = 256;
      const popupHeight = 220;
      const margin = 8;
      let top = rect.bottom + margin;
      if (top + popupHeight > window.innerHeight - margin) {
        top = rect.top - popupHeight - margin;
        if (top < margin) top = margin;
      }
      let left = rect.left;
      if (left + popupWidth > window.innerWidth - margin) {
        left = window.innerWidth - popupWidth - margin;
      }
      if (left < margin) left = margin;
      setEmojiOverlayStyle({ top, left, width: popupWidth });
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [editingId]);

  const handleSave = async () => {
    if (hasEmptyState) {
      setError('No se puede guardar mientras exista un estado sin nombre.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const success = await onSave({ states, maxPoints: (config.maxPoints as number) || 1 });
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Configurar Estados
          </h2>
          <button
            onClick={() => {
              if (!isDirty) {
                onClose();
                return;
              }
              setShowUnsavedDialog(true);
            }}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Personaliza tus estados de ánimo.
        </p>

        <div className="space-y-3">
          <Reorder.Group
            axis="y"
            values={states.map((state) => state.id)}
            onReorder={handleStatesReorder}
            className="space-y-3"
          >
            {states.map((state) => (
              <MoodStateReorderItem
                key={state.id}
                state={state}
                isDragging={draggingStateId === state.id}
                onDragStart={handleDragStartState}
                onDragEnd={() => setDraggingStateId(null)}
                onToggleEmojiEditor={(id) => setEditingId(editingId === id ? null : id)}
                onUpdateState={handleUpdateState}
                onDeleteState={handleDeleteState}
                editingId={editingId}
                emojiButtonRefs={emojiButtonRefs}
                emojiOverlayStyle={emojiOverlayStyle}
                emojiOverlayRef={emojiOverlayRef}
              />
            ))}
          </Reorder.Group>
        </div>

        <button
          type="button"
          onClick={handleAddState}
          disabled={!canAddNewState}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          <span>+</span> Agregar estado
        </button>

        {hasEmptyState && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Completa el estado pendiente antes de crear uno nuevo o guardar.
          </p>
        )}

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
            disabled={saving || hasEmptyState}
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

// Icono simple para no depender de librerías externas
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);