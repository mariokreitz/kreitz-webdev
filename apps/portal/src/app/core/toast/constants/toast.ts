import type { ToastSeverity } from '../types/toast.types';

export const DEFAULT_TOAST_DURATIONS_MS: Record<ToastSeverity, number> = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: 8000,
};
