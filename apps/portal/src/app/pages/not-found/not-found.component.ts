import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '@shared/ui';

@Component({
  selector: 'kwd-portal-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card],
  templateUrl: './not-found.component.html',
})
export default class NotFound {}
