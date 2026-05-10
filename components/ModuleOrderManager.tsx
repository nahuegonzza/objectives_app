'use client';

import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import type { Module } from '@types';
import UnsavedChangesModal from '@components/UnsavedChangesModal';

// Iconos para cada módulo
const moduleIcons: Record<string, string> = {
  sleep: '🌙',
  mood: '😊',
  water: '💧',
  finance: '💰',
  gym: '🏋️',
  work: '💼',
  academic: '📚',
  goals: '🎯',
};

// Colores para cada módulo
const moduleColors: Record<string, { bg: string; border: string; text: string }> = {
  sleep: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300' },
  mood: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
  water: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300' },
  finance: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
  gym: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' },
  work: { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  academic: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
  goals: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
};

interface ModuleOrderItem {
  id: string;
  slug: string;
  name: string;
  isGoalsPlaceholder?: boolean;
}

type ModuleReorderItemProps = {
  item: ModuleOrderItem;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
};

function ModuleReorderItem({ item, isDragging, onDragStart, onDragEnd }: ModuleReorderItemProps) {
  const dragControls = useDragControls();
  const icon = moduleIcons[item.slug] || '📦';
  const colors = moduleColors[item.slug] || moduleColors.work;

  return (
    <Reorder.Item
      key={item.id}
      value={item.id}
      layout={isDragging ? undefined : true}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 180, bounceDamping: 25, timeConstant: 20 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 18px 40px rgba(5, 150, 105, 0.18)' }}
      onDragEnd={onDragEnd}
      className={`rounded-2xl border ${colors.border} ${colors.bg} p-4`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className="text-3xl flex-shrink-0">{icon}</span>
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
            {item.name}
            {item.isGoalsPlaceholder && (
              <span className="text-xs ml-2 text-slate-500 dark:text-slate-400">(Habitos y Métricas)</span>
            )}
          </h3>
        </div>
        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            onDragStart(item.id);
            dragControls.start(event, { snapToCursor: true });
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#059669] transition hover:border-[#059669] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 touch-none flex-shrink-0"
          aria-label="Arrastrar módulo"
        >
          <span className="text-lg">≡</span>
        </button>
      </div>
    </Reorder.Item>
  );
}

type ModuleOrderManagerProps = {
  modules: Module[];
  onClose: () => void;
  onOrderSaved?: (orderUpdates: Array<{ id: string; order: number }>) => void;
};

export default function ModuleOrderManager({ modules, onClose, onOrderSaved }: ModuleOrderManagerProps) {
  const [orderedItems, setOrderedItems] = useState<ModuleOrderItem[]>([]);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const orderedItemsRef = useRef<ModuleOrderItem[]>([]);
  const initialOrderRef = useRef<string[]>([]);

  useEffect(() => {
    // Initialize items from modules
    const items: ModuleOrderItem[] = modules.map((module) => ({
      id: module.id,
      slug: module.slug,
      name: module.name,
      isGoalsPlaceholder: false,
    }));

    setOrderedItems(items);
    orderedItemsRef.current = items;
    if (initialOrderRef.current.length === 0 && items.length > 0) {
      initialOrderRef.current = items.map((item) => item.id);
    }
  }, [modules]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  function handleReorder(nextIds: string[]) {
    const reordered = nextIds
      .map((id) => orderedItemsRef.current.find((item) => item.id === id))
      .filter((item): item is ModuleOrderItem => Boolean(item));

    setOrderedItems(reordered);
    orderedItemsRef.current = reordered;
  }

  function handleDragStart(itemId: string) {
    setDraggingItemId(itemId);
  }

  function handleDragEnd() {
    setDraggingItemId(null);
  }

  const isDirty =
    JSON.stringify(orderedItems.map((item) => item.id)) !==
    JSON.stringify(initialOrderRef.current);

  const handleClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    setShowUnsavedDialog(true);
  };

  async function persistOrderedModules() {
    setSaving(true);
    try {
      const orderUpdates = orderedItemsRef.current
        .map((item, index) => ({
          id: item.id,
          order: index,
        }));

      const res = await fetch('/api/modules', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: orderUpdates }),
      });

      if (!res.ok) {
        throw new Error('Error saving module order');
      }

      setMessage('✓ Orden guardado');
      setMessageType('success');
      onOrderSaved?.(orderUpdates);
      onClose();
    } catch (error) {
      console.error('Error saving module order:', error);
      setMessage('Error al guardar el orden');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ordenar módulos</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Arrastra los módulos para cambiar su orden en la pantalla de inicio y calendario
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {message && (
            <div
              className={`mb-4 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
                messageType === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {message}
            </div>
          )}

          <Reorder.Group
            axis="y"
            values={orderedItems.map((item) => item.id)}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {orderedItems.map((item) => (
              <ModuleReorderItem
                key={item.id}
                item={item}
                isDragging={draggingItemId === item.id}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
          </Reorder.Group>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            onClick={persistOrderedModules}
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar orden'}
          </button>
        </div>
      </div>
      <UnsavedChangesModal
        open={showUnsavedDialog}
        onKeepEditing={() => setShowUnsavedDialog(false)}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          onClose();
        }}
      />    </div>
  );
}
