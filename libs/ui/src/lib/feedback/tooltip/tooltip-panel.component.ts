import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'kwd-ui-tooltip-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    '[id]': 'id()',
    class:
      'block pointer-events-none z-50 max-w-56 rounded-(--radius-md) bg-(--color-surface-container-highest) px-2 py-1 text-center text-body-sm text-(--color-on-surface) shadow-md',
  },
  template: `{{ text() }}`,
})
export class TooltipPanel {
  public readonly id = input.required<string>();
  public readonly text = input.required<string>();
}
