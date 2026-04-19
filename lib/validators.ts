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

  return undefined;
}

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
