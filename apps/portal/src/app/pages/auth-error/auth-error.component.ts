import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-portal-auth-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, TranslatePipe],
  templateUrl: './auth-error.component.html',
})
export default class AuthError {
  public readonly error = input<string>();

  public readonly errorLabel = computed(() => this.error()?.replaceAll('_', ' ') ?? null);
}
