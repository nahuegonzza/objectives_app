export type GoalType = 'BOOLEAN' | 'NUMERIC';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  emailVerified?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: GoalType;
  status: GoalStatus;
  icon: string;
  color: string;
  order?: number | null;
  pointsIfTrue?: number | null;
  pointsIfFalse?: number | null;
  pointsPerUnit?: number | null;
  isActive: boolean;
  deactivatedAt?: string | null;
  activatedAt: string;
  createdAt: string;
}

export interface GoalPayload {
  title: string;
  description?: string;
  type: GoalType;
  icon?: string;
  color?: string;
  order?: number;
  pointsIfTrue?: number;
  pointsIfFalse?: number;
  pointsPerUnit?: number;
  isActive?: boolean;
  deactivatedAt?: string | null;
  activatedAt?: string;
}

export interface GoalEntryPayload {
  goalId: string;
  date: string;
  value?: number | boolean;
  valueFloat?: number;
  valueBoolean?: boolean;
}

export interface GoalEntryWithGoal {
  id: string;
  userId: string;
  goalId: string;
  date: string;
  valueFloat?: number | null;
  valueBoolean?: boolean | null;
  createdAt: string;
  goal: Goal;
}

export interface ModuleEntry {
  id: string;
  userId: string;
  moduleId: string;
  date: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  module: ModuleState;
}

export interface Rule {
  id: string;
  userId: string;
  target: string;
  condition: string;
  action: string;
  priority: number;
  active: boolean;
  config?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Score {
  id: string;
  userId: string;
  date: string;
  points: number;
  createdAt: string;
}

export interface DailyScore {
  date: string;
  points: number;
  note: string;
}

export interface ScoreHistory {
  current: DailyScore;
  previousDay: DailyScore;
  previousWeek: DailyScore;
  previousMonth: DailyScore;
}

export interface ModuleDefinition {
  slug: string;
  name: string;
  description: string;
  supportedEvents: string[];
  defaultConfig: Record<string, unknown>;
  calculateScore?: (entries: ModuleEntry[], config: Record<string, unknown>) => number;
  Component?: React.ComponentType<{ config: Record<string, unknown>; module: ModuleState; onUpdate?: (data: any) => void; isEditing?: boolean; date?: string }>;
  ConfigComponent?: React.ComponentType<{ module: ModuleState; onConfigChange: (config: Record<string, unknown>) => void }>;
  DashboardComponent?: React.ComponentType<{ module: ModuleState; date: string }>;
  HistoryComponent?: React.ComponentType<{ date: string; data: any }>;
}

export interface ModuleState {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description?: string | null;
  active: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

export type Module = ModuleState;

export interface ActiveModule extends ModuleState {
  definition?: ModuleDefinition;
}

export interface Event {
  id: string;
  userId: string;
  goalId?: string | null;
  moduleId?: string | null;
  type: string;
  value: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}
