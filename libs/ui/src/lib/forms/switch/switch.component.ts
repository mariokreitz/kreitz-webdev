import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'kwd-ui-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule],
  templateUrl: './switch.component.html',
})
export class Switch {
  public readonly checked = input.required<boolean>();
  public readonly ariaLabel = input<string>();
  public readonly checkedIcon = input<IconDefinition>();
  public readonly uncheckedIcon = input<IconDefinition>();

  public readonly checkedChange = output<boolean>();
}
