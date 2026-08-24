import { ChangeDetectionStrategy, Component, input, output, signal, type WritableSignal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCopy, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import type { CreatedWebsiteToken } from '../../../../../core/api';

@Component({
  selector: 'kwd-portal-token-reveal-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './token-reveal-dialog.component.html',
})
export class TokenRevealDialog {
  public readonly token = input<CreatedWebsiteToken | null>(null);

  public readonly closed = output();

  protected readonly copyIcon = faCopy;
  protected readonly warningIcon = faTriangleExclamation;

  protected readonly copied: WritableSignal<boolean> = signal(false);

  public async onCopy(): Promise<void> {
    const value = this.token()?.token;

    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  public onClose(): void {
    this.copied.set(false);
    this.closed.emit();
  }
}
