import { z } from 'zod';

// Phone number validation (Nepal format)
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(10, 'Phone number must be 10 digits')
  .regex(/^9[78]\d{8}$/, 'Please enter a valid Nepal phone number (98XXXXXXXX or 97XXXXXXXX)');

// Staff credentials validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(50, 'Password must be less than 50 characters');

export const staffNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// Menu item validation
export const menuItemNameSchema = z
  .string()
  .min(2, 'Item name must be at least 2 characters')
  .max(50, 'Item name must be less than 50 characters');

export const menuItemDescriptionSchema = z
  .string()
  .max(200, 'Description must be less than 200 characters')
  .optional();

export const menuItemPriceSchema = z
  .number()
  .min(1, 'Price must be at least 1')
  .max(10000, 'Price must be less than 10000');

// Special instructions validation
export const specialInstructionsSchema = z
  .string()
  .max(200, 'Special instructions must be less than 200 characters')
  .optional();

// URL validation for social media links
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(500, 'URL must be less than 500 characters')
  .optional()
  .or(z.literal(''));

// WiFi credentials validation
export const wifiSSIDSchema = z
  .string()
  .max(32, 'WiFi name must be less than 32 characters')
  .optional()
  .or(z.literal(''));

export const wifiPasswordSchema = z
  .string()
  .max(63, 'WiFi password must be less than 63 characters')
  .optional()
  .or(z.literal(''));

// Restaurant name validation
export const restaurantNameSchema = z
  .string()
  .min(1, 'Restaurant name is required')
  .max(50, 'Restaurant name must be less than 50 characters');

// Validate and return result with error message
export function validateInput<T>(schema: z.ZodSchema<T>, value: unknown): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid input' };
}

// Rate limiting for login attempts (client-side)
const loginAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil: number }> = new Map();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(username: string): { allowed: boolean; remainingTime?: number; attemptsLeft?: number } {
  const now = Date.now();
  const key = username.toLowerCase();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
  }

  // Check if locked out
  if (record.lockedUntil > now) {
    const remainingTime = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingTime };
  }

  // Reset if attempt window has passed
  if (now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(key);
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
  }

  const attemptsLeft = MAX_ATTEMPTS - record.count;
  return { allowed: true, attemptsLeft };
}

export function recordLoginAttempt(username: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(username.toLowerCase());
    return;
  }

  const now = Date.now();
  const key = username.toLowerCase();
  const record = loginAttempts.get(key);

  if (!record) {
    loginAttempts.set(key, { count: 1, lastAttempt: now, lockedUntil: 0 });
    return;
  }

  // Reset if window has passed
  if (now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(key, { count: 1, lastAttempt: now, lockedUntil: 0 });
    return;
  }

  const newCount = record.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION : 0;
  
  loginAttempts.set(key, { count: newCount, lastAttempt: now, lockedUntil });
}

// Sanitize text input (basic XSS prevention - React already escapes, but this adds extra safety)
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
