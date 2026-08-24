import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-ui-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialog {
  public readonly open = input.required<boolean>();
  public readonly title = input.required<string>();
  public readonly message = input.required<string>();
  public readonly confirmLabel = input.required<string>();
  public readonly busy = input(false);

  public readonly confirmed = output();
  public readonly cancelled = output();

  public onConfirm(): void {
    if (this.busy()) {
      return;
    }

    this.confirmed.emit();
  }

  public onCancel(): void {
    if (this.busy()) {
      return;
    }

    this.cancelled.emit();
  }
}
