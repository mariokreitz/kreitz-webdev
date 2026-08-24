import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant = 'default' | 'narrow';

@Component({
  selector: 'kwd-ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  templateUrl: './card.component.html',
})
export class Card {
  public readonly variant = input<CardVariant>('default');
}
