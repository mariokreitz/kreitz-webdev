import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { Toast } from '@shared/ui';
import { ToastService } from './toast.service';
import type { ToastEntry } from './types/toast.types';

@Component({
  selector: 'kwd-portal-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toast],
  templateUrl: './toast-outlet.component.html',
})
export class ToastOutlet {
  private readonly toastService: ToastService = inject(ToastService);
  public readonly toasts: Signal<readonly ToastEntry[]> = computed(() => this.toastService.toasts());

  public dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
