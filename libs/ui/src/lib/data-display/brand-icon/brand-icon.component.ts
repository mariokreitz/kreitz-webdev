import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BrandIconFillRule = 'nonzero' | 'evenodd';

@Component({
  selector: 'kwd-ui-brand-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  templateUrl: './brand-icon.component.html',
})
export class BrandIcon {
  public readonly path = input.required<string>();
  public readonly viewBox = input<string>('0 0 24 24');
  public readonly fillRule = input<BrandIconFillRule>('nonzero');
}
