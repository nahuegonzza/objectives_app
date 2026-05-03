'use client';

import { useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import type { Goal } from '@types';
import { ICON_OPTIONS, COLOR_OPTIONS, getGoalIcon, getColorOption } from '@lib/goalIconsColors';
import GoalForm from '@components/GoalForm';
import NumberInput from '@components/NumberInput';
import { GoalEditModal } from '@components/GoalEditModal';

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    setLoading(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/goals', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
      setStatusMessage(error instanceof Error ? `Error cargando objetivos: ${error.message}` : 'Error cargando objetivos');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  }

  function handleEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setShowEditModal(true);
  }

  async function handleSaveEditGoal(goalId: string, updates: Partial<Goal>) {
    const payload = {
      title: updates.title,
      description: updates.description,
      type: updates.type,
      icon: updates.icon,
      color: updates.color,
      order: updates.order,
      pointsIfTrue: updates.pointsIfTrue,
      pointsIfFalse: updates.pointsIfFalse,
      pointsPerUnit: updates.pointsPerUnit,
      activatedAt: updates.activatedAt,
      weekDays: updates.weekDays ?? []
    };

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }

      setStatusMessage('Objetivo actualizado correctamente');
      setStatusType('success');
      loadGoals(); // Reload goals to reflect changes
    } catch (error) {
      console.error('Error updating goal:', error);
      setStatusMessage(error instanceof Error ? `Error actualizando objetivo: ${error.message}` : 'Error actualizando objetivo');
      setStatusType('error');
    } finally {
      setShowEditModal(false);
      setEditingGoal(null);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }
      setStatusMessage('Objetivo eliminado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error deleting goal:', error);
      setStatusMessage(error instanceof Error ? `Error eliminando objetivo: ${error.message}` : 'Error eliminando objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  async function handleDeactivateGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }
      setStatusMessage('Objetivo desactivado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error deactivating goal:', error);
      setStatusMessage(error instanceof Error ? `Error desactivando objetivo: ${error.message}` : 'Error desactivando objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  async function handleReactivateGoal(goalId: string) {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP error! status: ${response.status}`);
      }
      setStatusMessage('Objetivo reactivado correctamente');
      setStatusType('success');
    } catch (error) {
      console.error('Error reactivating goal:', error);
      setStatusMessage(error instanceof Error ? `Error reactivando objetivo: ${error.message}` : 'Error reactivando objetivo');
      setStatusType('error');
    } finally {
      loadGoals();
    }
  }

  const activeGoals = goals.filter((goal) => goal.isActive !== false);

  const booleanGoals = activeGoals.filter((goal) => goal.type === 'BOOLEAN');
  const numericGoals = activeGoals.filter((goal) => goal.type === 'NUMERIC');

  const getOrderedBooleanGoals = () => {
    return [...booleanGoals].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  };

  const getOrderedNumericGoals = () => {
    return [...numericGoals].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  };

  const getCombinedOrderedGoals = () => {
    return [...getOrderedBooleanGoals(), ...getOrderedNumericGoals()];
  };

  async function persistOrderedGoals(orderedGoals: Goal[]) {
    try {
      const responses = await Promise.all(
        orderedGoals.map((goal, index) =>
          fetch(`/api/goals/${goal.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index + 1 })
          })
        )
      );

      for (const response of responses) {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || `HTTP error! status: ${response.status}`);
        }
      }

      setStatusMessage('Orden de objetivos actualizado');
      setStatusType('success');
    } catch (error) {
      console.error('Error updating goal order:', error);
      setStatusMessage(error instanceof Error ? `Error actualizando orden: ${error.message}` : 'Error actualizando orden');
      setStatusType('error');
    } finally {
      setDraggedGoalId(null);
      setDragOverGoalId(null);
      loadGoals();
    }
  }

  function getOrderedActiveGoals() {
    return getCombinedOrderedGoals();
  }

  function getVisuallyOrderedGoals() {
    if (!draggedGoalId || !dragOverGoalId || draggedGoalId === dragOverGoalId) {
      return getOrderedActiveGoals();
    }

    const orderedGoals = getOrderedActiveGoals();
    const draggedIndex = orderedGoals.findIndex((goal) => goal.id === draggedGoalId);
    const targetIndex = orderedGoals.findIndex((goal) => goal.id === dragOverGoalId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return orderedGoals;
    }

    if (draggedIndex === targetIndex) {
      return orderedGoals;
    }

    const nextGoals = [...orderedGoals];
    const [movedGoal] = nextGoals.splice(draggedIndex, 1);
    const finalIndex = draggedIndex < targetIndex 
      ? (dragOverPosition === 'before' ? targetIndex - 1 : targetIndex)
      : (dragOverPosition === 'before' ? targetIndex : targetIndex + 1);
    nextGoals.splice(finalIndex, 0, movedGoal);

    return nextGoals;
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, goalId: string) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', goalId);
    setDraggedGoalId(goalId);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, goalId: string) {
    event.preventDefault();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = event.clientY < midpoint ? 'before' : 'after';
    
    if (goalId !== dragOverGoalId || dragOverPosition !== position) {
      setDragOverGoalId(goalId);
      setDragOverPosition(position);
    }
  }

  function handleDragLeave(goalId: string) {
    if (dragOverGoalId === goalId) {
      setDragOverGoalId(null);
      setDragOverPosition(null);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>, goalId: string) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text/plain');
    if (!draggedId) {
      setDraggedGoalId(null);
      setDragOverGoalId(null);
      setDragOverPosition(null);
      return;
    }

    const orderedGoals = getOrderedActiveGoals();
    const draggedIndex = orderedGoals.findIndex((goal) => goal.id === draggedId);
    const targetIndex = orderedGoals.findIndex((goal) => goal.id === goalId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedGoalId(null);
      setDragOverGoalId(null);
      setDragOverPosition(null);
      return;
    }

    if (draggedIndex === targetIndex) {
      setDraggedGoalId(null);
      setDragOverGoalId(null);
      setDragOverPosition(null);
      return;
    }

    const nextGoals = [...orderedGoals];
    const [movedGoal] = nextGoals.splice(draggedIndex, 1);
    const finalIndex = draggedIndex < targetIndex 
      ? (dragOverPosition === 'before' ? targetIndex - 1 : targetIndex)
      : (dragOverPosition === 'before' ? targetIndex : targetIndex + 1);
    nextGoals.splice(finalIndex, 0, movedGoal);

    await persistOrderedGoals(nextGoals);
  }

  function handleDragEnd() {
    setDraggedGoalId(null);
    setDragOverGoalId(null);
    setDragOverPosition(null);
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Todos los Objetivos
            </h2>
            {statusMessage && (
              <p className={`mt-2 text-sm font-medium ${statusType === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                {statusMessage}
              </p>
            )}
            {!showInactive && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Arrastra los objetivos dentro de cada sección para cambiar su orden.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <span>{showCreateForm ? 'Cancelar' : 'Nuevo objetivo'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowInactive(!showInactive)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                showInactive
                  ? 'bg-slate-600 text-white hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span>{showInactive ? '← Ver Activos' : 'Ver Desactivados →'}</span>
            </button>
          </div>
        </div>
        {showCreateForm && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
            <GoalForm onSuccess={() => {
              loadGoals();
              setShowCreateForm(false);
            }} />
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : showInactive ? (
          sortedGoals.filter(g => g.isActive === false).length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No hay objetivos desactivados.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Objetivos Desactivados</h3>
              {sortedGoals.filter(g => g.isActive === false).map((goal) => {
                const icon = getGoalIcon(goal.icon);
                const colorOption = getColorOption(goal.color);

                return (
                  <div 
                    key={goal.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200"
                  >
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                            <input
                              value={editForm.title ?? ''}
                              onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                            <select
                              value={editForm.type ?? 'BOOLEAN'}
                              onChange={(event) => setEditForm({ ...editForm, type: event.target.value as Goal['type'] })}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="BOOLEAN">Booleano</option>
                              <option value="NUMERIC">Numérico</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                          <textarea
                            value={editForm.description ?? ''}
                            onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={2}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="relative">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
                            <button
                              type="button"
                              onClick={() => setShowIconPicker(!showIconPicker)}
                              className="w-fit min-w-\[60px\] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {getGoalIcon(editForm.icon ?? 'star')}
                            </button>
                            {showIconPicker && (
                              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 grid grid-cols-6 gap-1 z-10 max-h-48 overflow-y-auto">
                                {ICON_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => {
                                      setEditForm({ ...editForm, icon: opt.key });
                                      setShowIconPicker(false);
                                    }}
                                    className="text-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                                    title={opt.label}
                                  >
                                    {opt.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="relative">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
                            <button
                              type="button"
                              onClick={() => setShowColorPicker(!showColorPicker)}
                              className="flex items-center gap-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <div 
                                className="w-6 h-6 rounded-full border-2"
                                style={{
                                  backgroundColor: getColorOption(editForm.color as string)?.bgColor || '#ffffff',
                                  borderColor: getColorOption(editForm.color as string)?.borderColor || '#e5e5e5'
                                }}
                              />
                              <span>{String(editForm.color && COLOR_OPTIONS.find(opt => opt.key === editForm.color) ? (editForm.color as string).charAt(0).toUpperCase() + (editForm.color as string).slice(1) : editForm.color ? 'Custom' : 'White')}</span>
                            </button>
                            {showColorPicker && (
                              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-4 z-10">
                                <div className="grid grid-cols-6 gap-3">
                                  {COLOR_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => {
                                        setEditForm({ ...editForm, color: opt.key });
                                        setShowColorPicker(false);
                                        setShowRgbPicker(false);
                                      }}
                                      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                                      style={{
                                        backgroundColor: opt.bgColor,
                                        borderColor: opt.borderColor,
                                        boxShadow: editForm.color === opt.key ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none',
                                        opacity: editForm.color === opt.key ? 1 : 0.7
                                      }}
                                      title={opt.label}
                                      onMouseEnter={(e) => {
                                        const target = e.currentTarget as HTMLButtonElement;
                                        target.style.opacity = '1';
                                      }}
                                      onMouseLeave={(e) => {
                                        const target = e.currentTarget as HTMLButtonElement;
                                        if (editForm.color !== opt.key) {
                                          target.style.opacity = '0.7';
                                        }
                                      }}
                                    />
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setShowRgbPicker(!showRgbPicker)}
                                    className="w-8 h-8 rounded-full border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:scale-110 transition-all focus:outline-none"
                                    title="RGB Personalizado"
                                    style={{
                                      boxShadow: showRgbPicker ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none'
                                    }}
                                  >
                                    RGB
                                  </button>
                                </div>
                                
                                {showRgbPicker && (
                                  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500">
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rojo</label>
                                        <input
                                          type="range"
                                          min="0"
                                          max="255"
                                          value={rgbColor.r}
                                          onChange={(e) => {
                                            const newRgb = { ...rgbColor, r: parseInt(e.target.value) };
                                            setRgbColor(newRgb);
                                          }}
                                          className="w-full"
                                        />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.r}</span>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Verde</label>
                                        <input
                                          type="range"
                                          min="0"
                                          max="255"
                                          value={rgbColor.g}
                                          onChange={(e) => {
                                            const newRgb = { ...rgbColor, g: parseInt(e.target.value) };
                                            setRgbColor(newRgb);
                                          }}
                                          className="w-full"
                                        />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.g}</span>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Azul</label>
                                        <input
                                          type="range"
                                          min="0"
                                          max="255"
                                          value={rgbColor.b}
                                          onChange={(e) => {
                                            const newRgb = { ...rgbColor, b: parseInt(e.target.value) };
                                            setRgbColor(newRgb);
                                          }}
                                          className="w-full"
                                        />
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.b}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <div 
                                          className="flex-1 h-8 rounded border-2 border-slate-300 dark:border-slate-500"
                                          style={{
                                            backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const hexColor = `#${[rgbColor.r, rgbColor.g, rgbColor.b]
                                              .map(x => {
                                                const hex = x.toString(16);
                                                return hex.length === 1 ? '0' + hex : hex;
                                              })
                                              .join('')
                                              .toUpperCase()}`;
                                            setEditForm({ ...editForm, color: hexColor });
                                            setShowColorPicker(false);
                                            setShowRgbPicker(false);
                                          }}
                                          className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                        >
                                          Aplicar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                              {editForm.type === 'BOOLEAN' ? 'Puntos si ✔' : 'Puntos por unidad'}
                            </label>
                            <NumberInput
                              value={editForm.type === 'BOOLEAN' ? editForm.pointsIfTrue ?? 1 : editForm.pointsPerUnit ?? 1}
                              onCommit={(value) =>
                                setEditForm({
                                  ...editForm,
                                  ...(editForm.type === 'BOOLEAN'
                                    ? { pointsIfTrue: value }
                                    : { pointsPerUnit: value })
                                })
                              }
                              step={0.1}
                              ariaLabel={editForm.type === 'BOOLEAN' ? 'Puntos si verdadero' : 'Puntos por unidad'}
                            />
                          </div>

                          {editForm.type === 'BOOLEAN' && (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Puntos si ✖
                              </label>
                              <NumberInput
                                value={editForm.pointsIfFalse ?? 0}
                                onCommit={(value) => setEditForm({ ...editForm, pointsIfFalse: value })}
                                step={0.1}
                                ariaLabel="Puntos si falso"
                              />
                            </div>
                          )}
                        </div>

                        {/* Días de la semana en edición */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                              Días de la semana {(editForm.weekDays as number[])?.length > 0 ? `(${(editForm.weekDays as number[])?.length} seleccionados)` : '(Todos los días)'}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const allDays = [0, 1, 2, 3, 4, 5, 6];
                                const currentDays = (editForm.weekDays as number[]) || [];
                                setEditForm({ ...editForm, weekDays: currentDays.length === 7 ? [] : allDays });
                              }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {(editForm.weekDays as number[])?.length === 7 ? 'Desactivar todos' : 'Activar todos'}
                            </button>
                          </div>
                          <div className="flex gap-2 justify-center">
                            {[
                              { index: 0, label: 'D', full: 'Domingo' },
                              { index: 1, label: 'L', full: 'Lunes' },
                              { index: 2, label: 'M', full: 'Martes' },
                              { index: 3, label: 'X', full: 'Miércoles' },
                              { index: 4, label: 'J', full: 'Jueves' },
                              { index: 5, label: 'V', full: 'Viernes' },
                              { index: 6, label: 'S', full: 'Sábado' }
                            ].map((day) => {
                              const currentDays = (editForm.weekDays as number[]) || [];
                              const isSelected = currentDays.includes(day.index);
                              return (
                                <button
                                  key={day.index}
                                  type="button"
                                  onClick={() => {
                                    const newDays = isSelected
                                      ? currentDays.filter(d => d !== day.index)
                                      : [...currentDays, day.index];
                                    setEditForm({ ...editForm, weekDays: newDays });
                                  }}
                                  className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                                  }`}
                                  title={day.full}
                                >
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
                            {(editForm.weekDays as number[])?.length > 0 && (editForm.weekDays as number[]).length < 7
                              ? `Este objetivo aparecerá solo los días: ${(editForm.weekDays as number[]).map(d => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d]).join(', ')}`
                              : 'Este objetivo aparecerá todos los días'}
                          </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateGoal(goal.id)}
                            className="rounded-lg bg-emerald-600 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 transition"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGoalId(null);
                              setEditForm({});
                            }}
                            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          >
                            Cancelar
                          </button>
                      </div>
                    </>
                  </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <span className="text-3xl">{icon}</span>
                              <div 
                                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
                                style={{
                                  backgroundColor: colorOption?.bgColor || '#9ca3af',
                                }}
                                title={goal.color}
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{goal.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{goal.description ?? 'Sin descripción'}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {goal.type === 'BOOLEAN'
                                  ? `V: ${goal.pointsIfTrue ?? 1}, F: ${goal.pointsIfFalse ?? 0}`
                                  : `${goal.pointsPerUnit ?? 1} pts/u`}
                              </p>
                              {goal.deactivatedAt && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                  Desactivado: {new Date(goal.deactivatedAt).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              title="Reactivar"
                              type="button"
                              onClick={() => handleReactivateGoal(goal.id)}
                              className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                            >
                              ↻
                            </button>
                            <button
                              title="Eliminar permanentemente"
                              type="button"
                              onClick={() => {
                                if (confirm('¿Estás seguro de que quieres eliminar permanentemente este objetivo? Esta acción no se puede deshacer.')) {
                                  handleDeleteGoal(goal.id);
                                }
                              }}
                              className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950 px-3 py-2 text-sm font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : activeGoals.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No hay objetivos creados aún.</p>
        ) : (
          <div className="space-y-6">
            {getOrderedBooleanGoals().length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hábitos</h3>
                {getOrderedBooleanGoals().map((goal) => {
                  const icon = getGoalIcon(goal.icon);
                  const isDragging = draggedGoalId === goal.id;
                  const colorOption = getColorOption(goal.color);

                  return (
                    <div 
                      key={goal.id}
                      draggable={!isEditing}
                      onDragStart={(event) => !isEditing && handleDragStart(event, goal.id)}
                      onDragOver={(event) => !isEditing && handleDragOver(event, goal.id)}
                      onDragEnter={(event) => !isEditing && handleDragOver(event, goal.id)}
                      onDragLeave={() => !isEditing && handleDragLeave(goal.id)}
                      onDrop={(event) => !isEditing && handleDrop(event, goal.id)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200 transform-gpu will-change-transform ${isDragging ? 'opacity-80 border-emerald-400 shadow-lg' : ''}`}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                              <input
                                value={editForm.title ?? ''}
                                onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                              <select
                                value={editForm.type ?? 'BOOLEAN'}
                                onChange={(event) => setEditForm({ ...editForm, type: event.target.value as Goal['type'] })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="BOOLEAN">Booleano</option>
                                <option value="NUMERIC">Numérico</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                            <textarea
                              value={editForm.description ?? ''}
                              onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              rows={2}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="relative">
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
                              <button
                                type="button"
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="w-fit min-w-\[60px\] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                {getGoalIcon(editForm.icon ?? 'star')}
                              </button>
                              {showIconPicker && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 grid grid-cols-6 gap-1 z-10 max-h-48 overflow-y-auto">
                                  {ICON_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => {
                                        setEditForm({ ...editForm, icon: opt.key });
                                        setShowIconPicker(false);
                                      }}
                                      className="text-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                      title={opt.label}
                                    >
                                      {opt.emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="relative">
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
                              <button
                                type="button"
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="flex items-center gap-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <div 
                                  className="w-6 h-6 rounded-full border-2"
                                  style={{
                                    backgroundColor: getColorOption(editForm.color as string)?.bgColor || '#ffffff',
                                    borderColor: getColorOption(editForm.color as string)?.borderColor || '#e5e5e5'
                                  }}
                                />
                                <span>{String(editForm.color && COLOR_OPTIONS.find(opt => opt.key === editForm.color) ? (editForm.color as string).charAt(0).toUpperCase() + (editForm.color as string).slice(1) : editForm.color ? 'Custom' : 'White')}</span>
                              </button>
                              {showColorPicker && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-4 z-10">
                                  <div className="grid grid-cols-6 gap-3">
                                    {COLOR_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                          setEditForm({ ...editForm, color: opt.key });
                                          setShowColorPicker(false);
                                          setShowRgbPicker(false);
                                        }}
                                        className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                                        style={{
                                          backgroundColor: opt.bgColor,
                                          borderColor: opt.borderColor,
                                          boxShadow: editForm.color === opt.key ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none',
                                          opacity: editForm.color === opt.key ? 1 : 0.7
                                        }}
                                        title={opt.label}
                                        onMouseEnter={(e) => {
                                          const target = e.currentTarget as HTMLButtonElement;
                                          target.style.opacity = '1';
                                        }}
                                        onMouseLeave={(e) => {
                                          const target = e.currentTarget as HTMLButtonElement;
                                          if (editForm.color !== opt.key) {
                                            target.style.opacity = '0.7';
                                          }
                                        }}
                                      />
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setShowRgbPicker(!showRgbPicker)}
                                      className="w-8 h-8 rounded-full border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:scale-110 transition-all focus:outline-none"
                                      title="RGB Personalizado"
                                      style={{
                                        boxShadow: showRgbPicker ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none'
                                      }}
                                    >
                                      RGB
                                    </button>
                                  </div>
                                  
                                  {showRgbPicker && (
                                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500">
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rojo</label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgbColor.r}
                                            onChange={(e) => {
                                              const newRgb = { ...rgbColor, r: parseInt(e.target.value) };
                                              setRgbColor(newRgb);
                                            }}
                                            className="w-full"
                                          />
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.r}</span>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Verde</label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgbColor.g}
                                            onChange={(e) => {
                                              const newRgb = { ...rgbColor, g: parseInt(e.target.value) };
                                              setRgbColor(newRgb);
                                            }}
                                            className="w-full"
                                          />
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.g}</span>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Azul</label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgbColor.b}
                                            onChange={(e) => {
                                              const newRgb = { ...rgbColor, b: parseInt(e.target.value) };
                                              setRgbColor(newRgb);
                                            }}
                                            className="w-full"
                                          />
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.b}</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <div 
                                            className="flex-1 h-8 rounded border-2 border-slate-300 dark:border-slate-500"
                                            style={{
                                              backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const hexColor = `#${[rgbColor.r, rgbColor.g, rgbColor.b]
                                                .map(x => {
                                                  const hex = x.toString(16);
                                                  return hex.length === 1 ? '0' + hex : hex;
                                                })
                                                .join('')
                                                .toUpperCase()}`;
                                              setEditForm({ ...editForm, color: hexColor });
                                              setShowColorPicker(false);
                                              setShowRgbPicker(false);
                                            }}
                                            className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                          >
                                            Aplicar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {editForm.type === 'BOOLEAN' ? 'Puntos si ✔' : 'Puntos por unidad'}
                              </label>
                              <NumberInput
                                value={editForm.type === 'BOOLEAN' ? editForm.pointsIfTrue ?? 1 : editForm.pointsPerUnit ?? 1}
                                onCommit={(value) =>
                                  setEditForm({
                                    ...editForm,
                                    ...(editForm.type === 'BOOLEAN'
                                      ? { pointsIfTrue: value }
                                      : { pointsPerUnit: value })
                                  })
                                }
                                step={0.1}
                                ariaLabel={editForm.type === 'BOOLEAN' ? 'Puntos si verdadero' : 'Puntos por unidad'}
                              />
                            </div>

                            {editForm.type === 'BOOLEAN' && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Puntos si ✖
                                </label>
                                <NumberInput
                                  value={editForm.pointsIfFalse ?? 0}
                                  onCommit={(value) => setEditForm({ ...editForm, pointsIfFalse: value })}
                                  step={0.1}
                                  ariaLabel="Puntos si falso"
                                />
                              </div>
                            )}
                          </div>

                          {/* Días de la semana en edición */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Días de la semana {(editForm.weekDays as number[])?.length > 0 ? `(${(editForm.weekDays as number[])?.length} seleccionados)` : '(Todos los días)'}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const allDays = [0, 1, 2, 3, 4, 5, 6];
                                  const currentDays = (editForm.weekDays as number[]) || [];
                                  setEditForm({ ...editForm, weekDays: currentDays.length === 7 ? [] : allDays });
                                }}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                {(editForm.weekDays as number[])?.length === 7 ? 'Desactivar todos' : 'Activar todos'}
                              </button>
                            </div>
                            <div className="flex gap-2 justify-center">
                              {[
                                { index: 0, label: 'D', full: 'Domingo' },
                                { index: 1, label: 'L', full: 'Lunes' },
                                { index: 2, label: 'M', full: 'Martes' },
                                { index: 3, label: 'X', full: 'Miércoles' },
                                { index: 4, label: 'J', full: 'Jueves' },
                                { index: 5, label: 'V', full: 'Viernes' },
                                { index: 6, label: 'S', full: 'Sábado' }
                              ].map((day) => {
                                const currentDays = (editForm.weekDays as number[]) || [];
                                const isSelected = currentDays.includes(day.index);
                                return (
                                  <button
                                    key={day.index}
                                    type="button"
                                    onClick={() => {
                                      const newDays = isSelected
                                        ? currentDays.filter(d => d !== day.index)
                                        : [...currentDays, day.index];
                                      setEditForm({ ...editForm, weekDays: newDays });
                                    }}
                                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                    title={day.full}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
                              {(editForm.weekDays as number[])?.length > 0 && (editForm.weekDays as number[]).length < 7
                                ? `Este objetivo aparecerá solo los días: ${(editForm.weekDays as number[]).map(d => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d]).join(', ')}`
                                : 'Este objetivo aparecerá todos los días'}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateGoal(goal.id)}
                              className="rounded-lg bg-emerald-600 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 transition"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGoalId(null);
                                setEditForm({});
                              }}
                              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative">
                                <span className="text-3xl">{icon}</span>
                                <div 
                                  className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
                                  style={{
                                    backgroundColor: colorOption?.bgColor || '#9ca3af',
                                  }}
                                  title={goal.color}
                                />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">{goal.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{goal.description ?? 'Sin descripción'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {goal.type === 'BOOLEAN'
                                    ? `V: ${goal.pointsIfTrue ?? 1}, F: ${goal.pointsIfFalse ?? 0}`
                                    : `${goal.pointsPerUnit ?? 1} pts/u`}
                                </p>
                                {goal.deactivatedAt && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    Desactivado: {new Date(goal.deactivatedAt).toLocaleDateString('es-ES')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                title="Editar"
                                type="button"
                                onClick={() => {
                                  setEditingGoalId(goal.id);
                                  setEditForm(goal);
                                }}
                                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                              >
                                ✏️
                              </button>
                              <button
                                title="Desactivar"
                                type="button"
                                onClick={() => handleDeactivateGoal(goal.id)}
                                className="rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900 transition"
                              >
                                ⛔
                              </button>
                              <button
                                title="Mover"
                                type="button"
                                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-grab"
                              >
                                ≡
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {getOrderedNumericGoals().length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Métricas</h3>
                {getOrderedNumericGoals().map((goal) => {
                  const icon = getGoalIcon(goal.icon);
                  const isEditing = editingGoalId === goal.id;
                  const isDragging = draggedGoalId === goal.id;
                  const colorOption = getColorOption(goal.color);

                  return (
                    <div 
                      key={goal.id}
                      draggable={!isEditing}
                      onDragStart={(event) => !isEditing && handleDragStart(event, goal.id)}
                      onDragOver={(event) => !isEditing && handleDragOver(event, goal.id)}
                      onDragEnter={(event) => !isEditing && handleDragOver(event, goal.id)}
                      onDragLeave={() => !isEditing && handleDragLeave(goal.id)}
                      onDrop={(event) => !isEditing && handleDrop(event, goal.id)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200 transform-gpu will-change-transform ${isDragging ? 'opacity-80 border-emerald-400 shadow-lg' : ''}`}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                              <input
                                value={editForm.title ?? ''}
                                onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo</label>
                              <select
                                value={editForm.type ?? 'BOOLEAN'}
                                onChange={(event) => setEditForm({ ...editForm, type: event.target.value as Goal['type'] })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="BOOLEAN">Booleano</option>
                                <option value="NUMERIC">Numérico</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                            <textarea
                              value={editForm.description ?? ''}
                              onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              rows={2}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="relative">
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Icono</label>
                              <button
                                type="button"
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="w-fit min-w-\[60px\] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                {getGoalIcon(editForm.icon ?? 'star')}
                              </button>
                              {showIconPicker && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 grid grid-cols-6 gap-1 z-10 max-h-48 overflow-y-auto">
                                  {ICON_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      onClick={() => {
                                        setEditForm({ ...editForm, icon: opt.key });
                                        setShowIconPicker(false);
                                      }}
                                      className="text-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                      title={opt.label}
                                    >
                                      {opt.emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="relative">
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
                              <button
                                type="button"
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="flex items-center gap-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <div 
                                  className="w-6 h-6 rounded-full border-2"
                                  style={{
                                    backgroundColor: getColorOption(editForm.color as string)?.bgColor || '#ffffff',
                                    borderColor: getColorOption(editForm.color as string)?.borderColor || '#e5e5e5'
                                  }}
                                />
                                <span>{String(editForm.color && COLOR_OPTIONS.find(opt => opt.key === editForm.color) ? (editForm.color as string).charAt(0).toUpperCase() + (editForm.color as string).slice(1) : editForm.color ? 'Custom' : 'White')}</span>
                              </button>
                              {showColorPicker && (
                                <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-4 z-10">
                                  <div className="grid grid-cols-6 gap-3">
                                    {COLOR_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => {
                                          setEditForm({ ...editForm, color: opt.key });
                                          setShowColorPicker(false);
                                          setShowRgbPicker(false);
                                        }}
                                        className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                                        style={{
                                          backgroundColor: opt.bgColor,
                                          borderColor: opt.borderColor,
                                          boxShadow: editForm.color === opt.key ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none',
                                          opacity: editForm.color === opt.key ? 1 : 0.7
                                        }}
                                        title={opt.label}
                                        onMouseEnter={(e) => {
                                          const target = e.currentTarget as HTMLButtonElement;
                                          target.style.opacity = '1';
                                        }}
                                        onMouseLeave={(e) => {
                                          const target = e.currentTarget as HTMLButtonElement;
                                          if (editForm.color !== opt.key) {
                                            target.style.opacity = '0.7';
                                          }
                                        }}
                                      />
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setShowRgbPicker(!showRgbPicker)}
                                      className="w-8 h-8 rounded-full border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:scale-110 transition-all focus:outline-none"
                                      title="RGB Personalizado"
                                      style={{
                                        boxShadow: showRgbPicker ? `0 0 0 3px rgb(16 185 129 / 0.5)` : 'none'
                                      }}
                                    >
                                      RGB
                                    </button>
                                  </div>
                                  
                                  {showRgbPicker && (
                                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-600 rounded border border-slate-300 dark:border-slate-500">
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rojo</label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgbColor.r}
                                            onChange={(e) => {
                                              const newRgb = { ...rgbColor, r: parseInt(e.target.value) };
                                              setRgbColor(newRgb);
                                            }}
                                            className="w-full"
                                          />
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.r}</span>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Verde</label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgbColor.g}
                                            onChange={(e) => {
                                              const newRgb = { ...rgbColor, g: parseInt(e.target.value) };
                                              setRgbColor(newRgb);
                                            }}
                                            className="w-full"
                                          />
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.g}</span>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Azul</label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="255"
                                            value={rgbColor.b}
                                            onChange={(e) => {
                                              const newRgb = { ...rgbColor, b: parseInt(e.target.value) };
                                              setRgbColor(newRgb);
                                            }}
                                            className="w-full"
                                          />
                                          <span className="text-xs text-slate-600 dark:text-slate-400">{rgbColor.b}</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <div 
                                            className="flex-1 h-8 rounded border-2 border-slate-300 dark:border-slate-500"
                                            style={{
                                              backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const hexColor = `#${[rgbColor.r, rgbColor.g, rgbColor.b]
                                                .map(x => {
                                                  const hex = x.toString(16);
                                                  return hex.length === 1 ? '0' + hex : hex;
                                                })
                                                .join('')
                                                .toUpperCase()}`;
                                              setEditForm({ ...editForm, color: hexColor });
                                              setShowColorPicker(false);
                                              setShowRgbPicker(false);
                                            }}
                                            className="px-3 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
                                          >
                                            Aplicar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {editForm.type === 'BOOLEAN' ? 'Puntos si ✔' : 'Puntos por unidad'}
                              </label>
                              <NumberInput
                                value={editForm.type === 'BOOLEAN' ? editForm.pointsIfTrue ?? 1 : editForm.pointsPerUnit ?? 1}
                                onCommit={(value) =>
                                  setEditForm({
                                    ...editForm,
                                    ...(editForm.type === 'BOOLEAN'
                                      ? { pointsIfTrue: value }
                                      : { pointsPerUnit: value })
                                  })
                                }
                                step={0.1}
                                ariaLabel={editForm.type === 'BOOLEAN' ? 'Puntos si verdadero' : 'Puntos por unidad'}
                              />
                            </div>

                            {editForm.type === 'BOOLEAN' && (
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Puntos si ✖
                                </label>
                                <NumberInput
                                  value={editForm.pointsIfFalse ?? 0}
                                  onCommit={(value) => setEditForm({ ...editForm, pointsIfFalse: value })}
                                  step={0.1}
                                  ariaLabel="Puntos si falso"
                                />
                              </div>
                            )}
                          </div>

{/* Días de la semana en edición */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Días de la semana {(editForm.weekDays as number[])?.length > 0 ? `(${(editForm.weekDays as number[])?.length} seleccionados)` : '(Todos los días)'}
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const allDays = [0, 1, 2, 3, 4, 5, 6];
                                  const currentDays = (editForm.weekDays as number[]) || [];
                                  setEditForm({ ...editForm, weekDays: currentDays.length === 7 ? [] : allDays });
                                }}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                {(editForm.weekDays as number[])?.length === 7 ? 'Desactivar todos' : 'Activar todos'}
                              </button>
                            </div>
                            <div className="flex gap-2 justify-center">
                              {[
                                { index: 0, label: 'D', full: 'Domingo' },
                                { index: 1, label: 'L', full: 'Lunes' },
                                { index: 2, label: 'M', full: 'Martes' },
                                { index: 3, label: 'X', full: 'Miércoles' },
                                { index: 4, label: 'J', full: 'Jueves' },
                                { index: 5, label: 'V', full: 'Viernes' },
                                { index: 6, label: 'S', full: 'Sábado' }
                              ].map((day) => {
                                const currentDays = (editForm.weekDays as number[]) || [];
                                const isSelected = currentDays.includes(day.index);
                                return (
                                  <button
                                    key={day.index}
                                    type="button"
                                    onClick={() => {
                                      const newDays = isSelected
                                        ? currentDays.filter(d => d !== day.index)
                                        : [...currentDays, day.index];
                                      setEditForm({ ...editForm, weekDays: newDays });
                                    }}
                                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                                    }`}
                                    title={day.full}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
                              {(editForm.weekDays as number[])?.length > 0 && (editForm.weekDays as number[]).length < 7
                                ? `Este objetivo aparecerá solo los días: ${(editForm.weekDays as number[]).map(d => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d]).join(', ')}`
                                : 'Este objetivo aparecerá todos los días'}
                            </p>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateGoal(goal.id)}
                              className="rounded-lg bg-emerald-600 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 transition"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGoalId(null);
                                setEditForm({});
                              }}
                              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative">
                                <span className="text-3xl">{icon}</span>
                                <div 
                                  className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
                                  style={{
                                    backgroundColor: colorOption?.bgColor || '#9ca3af',
                                  }}
                                  title={goal.color}
                                />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">{goal.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{goal.description ?? 'Sin descripción'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {goal.type === 'BOOLEAN'
                                    ? `V: ${goal.pointsIfTrue ?? 1}, F: ${goal.pointsIfFalse ?? 0}`
                                    : `${goal.pointsPerUnit ?? 1} pts/u`}
                                </p>
                                {goal.deactivatedAt && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    Desactivado: {new Date(goal.deactivatedAt).toLocaleDateString('es-ES')}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                title="Editar"
                                type="button"
                                onClick={() => {
                                  setEditingGoalId(goal.id);
                                  setEditForm(goal);
                                }}
                                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                              >
                                ✏️
                              </button>
                              <button
                                title="Desactivar"
                                type="button"
                                onClick={() => handleDeactivateGoal(goal.id)}
                                className="rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900 transition"
                              >
                                ⛔
                              </button>
                              <button
                                title="Mover"
                                type="button"
                                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-grab"
                              >
                                ≡
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <GoalEditModal
          goal={editingGoal}
          onSave={handleSaveEditGoal}
          onClose={() => {
            setShowEditModal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
