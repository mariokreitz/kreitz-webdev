import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { Spinner } from '../../feedback/spinner/spinner.component';

@Component({
  selector: 'kwd-ui-oauth-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule, Spinner],
  templateUrl: './oauth-button.component.html',
})
export class OauthButton {
  public readonly icon = input.required<IconDefinition>();
  public readonly label = input.required<string>();
  public readonly loadingLabel = input.required<string>();
  public readonly loading = input(false);
  public readonly disabled = input(false);

  public readonly buttonClick = output();
}
