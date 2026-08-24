import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

interface DiagnosticEntry {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'kwd-portal-error-diagnostics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './error-diagnostics.component.html',
})
export class ErrorDiagnostics {
  public readonly requestId = input<string>();
  public readonly statusCode = input<string>();
  public readonly timestamp = input<string>();
  public readonly path = input<string>();

  public readonly entries = computed<readonly DiagnosticEntry[]>(() =>
    [
      this.statusCode() ? { label: 'error.diagnostics.status', value: this.statusCode() as string } : null,
      { label: 'error.diagnostics.occurredAt', value: this.timestamp() ?? new Date().toISOString() },
      this.requestId() ? { label: 'error.diagnostics.requestId', value: this.requestId() as string } : null,
      this.path() ? { label: 'error.diagnostics.path', value: this.path() as string } : null,
    ].filter((entry): entry is DiagnosticEntry => entry !== null),
  );
}
