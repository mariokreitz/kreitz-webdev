import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-portal-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, TranslatePipe],
  templateUrl: './not-found.component.html',
})
export default class NotFound {}
