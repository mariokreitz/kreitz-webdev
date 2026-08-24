import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './button.component.html',
})
export class Button {
  public readonly icon = input.required<IconDefinition>();
  public readonly label = input.required<string>();
  public readonly loadingLabel = input.required<string>();
  public readonly loading = input(false);
  public readonly disabled = input(false);
}
