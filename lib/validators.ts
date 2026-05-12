import { z } from 'zod';

/**
 * Email validation utility
 * Validates email format according to standard rules
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  // Additional checks
  const length = email.length;
  const hasValidLength = length >= 5 && length <= 254;
  const hasValidLocalPart = email.split('@')[0].length <= 64;

  return isValid && hasValidLength && hasValidLocalPart;
}

/**
 * Password validation utility
 * Returns error message if invalid, undefined if valid
 */
export function validatePassword(password: string): string | undefined {
  if (!password || typeof password !== 'string') {
    return 'La contraseña es obligatoria';
  }

  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }

  if (password.length > 128) {
    return 'La contraseña no puede exceder 128 caracteres';
  }

  // Optional: enforce stronger password requirements
  // Uncomment if you want to require uppercase, numbers, and special characters
  /*
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales';
  }
  */
}

// Zod schemas for input validation

export const GoalPayloadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['BOOLEAN', 'NUMERIC']),
  icon: z.string().max(50).optional().default('star'),
  color: z.string().max(50).optional().default('slate'),
  order: z.number().int().min(0).optional(),
  pointsIfTrue: z.number().min(-1000).max(1000).optional().default(1),
  pointsIfFalse: z.number().min(-1000).max(1000).optional().default(0),
  pointsPerUnit: z.number().min(-1000).max(1000).optional(),
  isActive: z.boolean().optional().default(true),
  deactivatedAt: z.string().datetime().nullable().optional(),
  activatedAt: z.string().datetime().optional(),
  weekDays: z.array(z.number().int().min(0).max(6)).optional().default([]),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128, 'New password too long'),
});

export const GoalEntryPayloadSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  value: z.number().optional(),
  valueFloat: z.number().optional(),
  valueBoolean: z.boolean().optional(),
}).refine((data) => {
  // Ensure at least one value field is provided
  return data.value !== undefined || data.valueFloat !== undefined || data.valueBoolean !== undefined;
}, {
  message: 'At least one value field must be provided',
});

export type ValidatedGoalPayload = z.infer<typeof GoalPayloadSchema>;

export const GoalPatchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['BOOLEAN', 'NUMERIC']).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  order: z.number().int().min(0).optional(),
  pointsIfTrue: z.number().min(-1000).max(1000).optional(),
  pointsIfFalse: z.number().min(-1000).max(1000).optional(),
  pointsPerUnit: z.number().min(-1000).max(1000).optional(),
  isActive: z.boolean().optional(),
  activatedAt: z.string().datetime().optional(),
  weekDays: z.array(z.number().int().min(0).max(6)).optional(),
});

export const EventPayloadSchema = z.object({
  type: z.string().min(1).max(100),
  value: z.number().min(0).max(10000),
  moduleSlug: z.string().min(1).max(100),
  metadata: z.object({}).passthrough().optional(),
});

export const RulePayloadSchema = z.object({
  target: z.string().min(1).max(255),
  condition: z.string().min(1).max(500),
  action: z.string().min(1).max(500),
  priority: z.number().int().min(0).max(1000).optional().default(0),
  active: z.boolean().optional().default(true),
  config: z.object({}).passthrough().optional(),
});

export const ModuleEntryPayloadSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  data: z.object({}).passthrough(),
});

export type ValidatedGoalPatch = z.infer<typeof GoalPatchSchema>;
export type ValidatedEventPayload = z.infer<typeof EventPayloadSchema>;
export type ValidatedRulePayload = z.infer<typeof RulePayloadSchema>;
export type ValidatedModuleEntryPayload = z.infer<typeof ModuleEntryPayloadSchema>;

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate that a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
