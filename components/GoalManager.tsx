'use client';

import { useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import type { Goal } from '@types';
import { ICON_OPTIONS, COLOR_OPTIONS, getGoalIcon, getColorOption } from '@lib/goalIconsColors';
import GoalCreateModal from './GoalCreateModal';
import NumberInput from '@components/NumberInput';
import { GoalEditModal } from '@components/GoalEditModal';

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedGoalId, setDraggedGoalId] = useState<string | null>(null);
  const [dragOverGoalId, setDragOverGoalId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [editForm, setEditForm] = useState<Partial<Goal>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (statusMessage) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
        setStatusMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [statusMessage]);

  async function loadGoals() {
    setLoading(true);
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
    setEditForm(goal);
    setShowEditModal(true);
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setStatusMessage('✓ Registrado');
    setStatusType('success');
    loadGoals();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingGoal(null);
    setStatusMessage('✓ Registrado');
    setStatusType('success');
    loadGoals();
  };

  async function handleUpdateGoal(goalId: string) {
    await handleSaveEditGoal(goalId, editForm);
    setEditForm({});
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
        {showToast && statusMessage && (
          <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
            statusType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {statusMessage}
          </div>
        )}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Todos los Objetivos
            </h2>
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
          <GoalCreateModal
            onClose={() => setShowCreateForm(false)}
            onCreateSuccess={handleCreateSuccess}
          />
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
                const colorOption = getColorOption(goal.color);
                return (
                  <div 
                    key={goal.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <span className="text-3xl">{getGoalIcon(goal.icon)}</span>
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-4">
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
                );
              })}
            </div>
          )
        ) : activeGoals.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No hay objetivos creados aún.</p>
        ) : (
          <>
            {getOrderedBooleanGoals().length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hábitos</h3>
                {getOrderedBooleanGoals().map((goal) => {
                  const icon = getGoalIcon(goal.icon);
                  const colorOption = getColorOption(goal.color);
                  return (
                    <div 
                      key={goal.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, goal.id)}
                      onDragOver={(event) => handleDragOver(event, goal.id)}
                      onDragEnter={(event) => handleDragOver(event, goal.id)}
                      onDragLeave={() => handleDragLeave(goal.id)}
                      onDrop={(event) => handleDrop(event, goal.id)}
                      onDragEnd={handleDragEnd}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200"
                    >
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            title="Editar"
                            type="button"
                            onClick={() => handleEditGoal(goal)}
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
                        </div>
                      </div>
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
                  const colorOption = getColorOption(goal.color);
                  return (
                    <div 
                      key={goal.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, goal.id)}
                      onDragOver={(event) => handleDragOver(event, goal.id)}
                      onDragEnter={(event) => handleDragOver(event, goal.id)}
                      onDragLeave={() => handleDragLeave(goal.id)}
                      onDrop={(event) => handleDrop(event, goal.id)}
                      onDragEnd={handleDragEnd}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200"
                    >
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            title="Editar"
                            type="button"
                            onClick={() => handleEditGoal(goal)}
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showEditModal && (
        <GoalEditModal
          goal={editingGoal}
          onSave={handleSaveEditGoal}
          onSuccess={handleEditSuccess}
          onClose={() => {
            setShowEditModal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
