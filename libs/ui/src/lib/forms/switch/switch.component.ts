import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'kwd-ui-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  templateUrl: './switch.component.html',
})
export class Switch {
  public readonly checked = input.required<boolean>();
  public readonly ariaLabel = input<string>();

  public readonly checkedChange = output<boolean>();
}
