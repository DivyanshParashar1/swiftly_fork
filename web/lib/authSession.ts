import type { AuthUser } from './api';

const AUTH_USER_STORAGE_KEY = 'swiftly.auth.user';
export const AUTH_USER_CHANGED_EVENT = 'swiftly:auth-user-changed';

export const getAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;

  const rawValue = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as AuthUser;
  } catch {
    return null;
  }
};

export const setAuthUser = (user: AuthUser): void => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
};

export const clearAuthUser = (): void => {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
};