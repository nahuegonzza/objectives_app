'use client';

import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import type { Goal } from '@types';
import { ICON_OPTIONS, COLOR_OPTIONS, getGoalIcon, getColorOption } from '@lib/goalIconsColors';
import GoalCreateModal from './GoalCreateModal';
import NumberInput from '@components/NumberInput';
import { GoalEditModal } from '@components/GoalEditModal';

type GoalReorderItemProps = {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDeactivate: (goalId: string) => void;
  onDragEnd: () => void;
};

function GoalReorderItem({ goal, onEdit, onDeactivate, onDragEnd }: GoalReorderItemProps) {
  const dragControls = useDragControls();
  const icon = getGoalIcon(goal.icon);
  const colorOption = getColorOption(goal.color);

  return (
    <Reorder.Item
      key={goal.id}
      value={goal.id}
      layout
      layoutId={goal.id}
      dragListener={false}
      dragControls={dragControls}
      dragTransition={{ bounceStiffness: 600, bounceDamping: 40 }}
      whileDrag={{ scale: 1.02, boxShadow: '0 18px 40px rgba(5, 150, 105, 0.18)' }}
      onDragEnd={onDragEnd}
      className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 transition-all duration-200"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <span className="text-3xl">{icon}</span>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
              style={{ backgroundColor: colorOption?.bgColor || '#9ca3af' }}
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
            onClick={() => onEdit(goal)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            ✏️
          </button>
          <button
            title="Desactivar"
            type="button"
            onClick={() => onDeactivate(goal.id)}
            className="rounded-lg border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900 transition"
          >
            ⛔
          </button>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              dragControls.start(event, { snapToCursor: true });
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[#059669] transition hover:border-[#059669] hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 touch-none"
            aria-label="Arrastrar objetivo"
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function GoalManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habitGoals, setHabitGoals] = useState<Goal[]>([]);
  const [metricGoals, setMetricGoals] = useState<Goal[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [editForm, setEditForm] = useState<Partial<Goal>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showRgbPicker, setShowRgbPicker] = useState(false);
  const [rgbColor, setRgbColor] = useState({ r: 255, g: 255, b: 255 });
  const habitGoalsRef = useRef<Goal[]>([]);
  const metricGoalsRef = useRef<Goal[]>([]);

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

  const sortGoalsByOrder = (items: Goal[]) => [...items].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  useEffect(() => {
    const activeGoals = goals.filter((goal) => goal.isActive !== false);
    const sortedHabitGoals = sortGoalsByOrder(activeGoals.filter((goal) => goal.type === 'BOOLEAN'));
    const sortedMetricGoals = sortGoalsByOrder(activeGoals.filter((goal) => goal.type === 'NUMERIC'));

    setHabitGoals(sortedHabitGoals);
    setMetricGoals(sortedMetricGoals);
    habitGoalsRef.current = sortedHabitGoals;
    metricGoalsRef.current = sortedMetricGoals;
  }, [goals]);

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
    }
  }

  function reorderGoalsById(goalsList: Goal[], nextIds: string[]) {
    return nextIds
      .map((id) => goalsList.find((goal) => goal.id === id))
      .filter((goal): goal is Goal => Boolean(goal));
  }

  function updateGoalsOrderState(reorderedGoals: Goal[]) {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        const reordered = reorderedGoals.find((item) => item.id === goal.id);
        if (!reordered) return goal;
        return {
          ...goal,
          order: reorderedGoals.findIndex((item) => item.id === goal.id) + 1
        };
      })
    );
  }

  function handleHabitReorder(nextIds: string[]) {
    const nextGoals = reorderGoalsById(habitGoals, nextIds);
    setHabitGoals(nextGoals);
    habitGoalsRef.current = nextGoals;
  }

  function handleMetricReorder(nextIds: string[]) {
    const nextGoals = reorderGoalsById(metricGoals, nextIds);
    setMetricGoals(nextGoals);
    metricGoalsRef.current = nextGoals;
  }

  function handleHabitReorderEnd() {
    updateGoalsOrderState(habitGoalsRef.current);
    persistOrderedGoals(habitGoalsRef.current);
  }

  function handleMetricReorderEnd() {
    updateGoalsOrderState(metricGoalsRef.current);
    persistOrderedGoals(metricGoalsRef.current);
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
            {habitGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hábitos</h3>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-950/90 p-2">
                  <Reorder.Group axis="y" values={habitGoals.map((goal) => goal.id)} onReorder={handleHabitReorder} className="space-y-3">
                    {habitGoals.map((goal) => (
                      <GoalReorderItem
                        key={goal.id}
                        goal={goal}
                        onEdit={handleEditGoal}
                        onDeactivate={handleDeactivateGoal}
                        onDragEnd={handleHabitReorderEnd}
                      />
                    ))}
                  </Reorder.Group>
                </div>
              </div>
            )}

            {metricGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Métricas</h3>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-950/90 p-2">
                  <Reorder.Group axis="y" values={metricGoals.map((goal) => goal.id)} onReorder={handleMetricReorder} className="space-y-3">
                    {metricGoals.map((goal) => (
                      <GoalReorderItem
                        key={goal.id}
                        goal={goal}
                        onEdit={handleEditGoal}
                        onDeactivate={handleDeactivateGoal}
                        onDragEnd={handleMetricReorderEnd}
                      />
                    ))}
                  </Reorder.Group>
                </div>
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
