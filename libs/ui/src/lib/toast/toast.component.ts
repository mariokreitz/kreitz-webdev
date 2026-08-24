import { ChangeDetectionStrategy, Component, computed, input, output, type Signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import type { ToastSeverity } from './toast.types';

@Component({
  selector: 'kwd-ui-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule],
  templateUrl: './toast.component.html',
})
export class Toast {
  public readonly severity = input.required<ToastSeverity>();
  public readonly message = input.required<string>();
  public readonly durationMs = input.required<number>();
  public readonly dismiss = output();

  public readonly dismissIcon = faXmark;

  protected readonly ariaLive: Signal<'assertive' | 'polite'> = computed(() =>
    this.severity() === 'error' ? 'assertive' : 'polite',
  );

  protected readonly dotClass: Signal<string> = computed(() => {
    switch (this.severity()) {
      case 'success':
        return 'bg-(--color-secondary)';
      case 'error':
        return 'bg-(--color-error)';
      case 'warning':
        return 'bg-(--color-warning)';
      case 'info':
        return 'bg-(--color-info)';
    }
  });
}
