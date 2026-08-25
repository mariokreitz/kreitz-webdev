import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'kwd-ui-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [TranslatePipe],
  templateUrl: './spinner.component.html',
})
export class Spinner {
  public readonly size = input<SpinnerSize>('md');
}
