import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal, type Signal, type WritableSignal } from '@angular/core';
import { DEFAULT_TOAST_DURATIONS_MS } from './constants';
import type { ToastEntry, ToastSeverity } from './types/toast.types';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly entries: WritableSignal<readonly ToastEntry[]> = signal([]);
  public readonly toasts: Signal<readonly ToastEntry[]> = this.entries.asReadonly();

  public show(input: { severity: ToastSeverity; message: string; durationMs?: number }): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const entry: ToastEntry = {
      id: crypto.randomUUID(),
      severity: input.severity,
      message: input.message,
      durationMs: input.durationMs ?? DEFAULT_TOAST_DURATIONS_MS[input.severity],
    };

    this.entries.update((current) => [...current, entry]);
  }

  public dismiss(id: string): void {
    this.entries.update((current) => current.filter((entry) => entry.id !== id));
  }
}
