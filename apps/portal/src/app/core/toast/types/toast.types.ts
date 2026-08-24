import type { ToastSeverity } from '@shared/ui';

export type { ToastSeverity };

export interface ToastEntry {
  readonly id: string;
  readonly severity: ToastSeverity;
  readonly message: string;
  readonly durationMs: number;
}
