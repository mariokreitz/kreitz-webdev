import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-portal-danger-zone-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './danger-zone-card.component.html',
})
export class DangerZoneCard {
  public readonly warningIcon = faTriangleExclamation;
}
