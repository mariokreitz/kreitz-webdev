import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'kwd-ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  templateUrl: './card.component.html',
})
export class Card {}
