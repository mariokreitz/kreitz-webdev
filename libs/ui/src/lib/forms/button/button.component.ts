import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { Spinner } from '../../feedback/spinner/spinner.component';

@Component({
  selector: 'kwd-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule, Spinner],
  templateUrl: './button.component.html',
})
export class Button {
  public readonly icon = input.required<IconDefinition>();
  public readonly label = input.required<string>();
  public readonly loadingLabel = input.required<string>();
  public readonly loading = input(false);
  public readonly disabled = input(false);
}
