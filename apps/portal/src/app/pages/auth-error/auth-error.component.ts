import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'kwd-portal-auth-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './auth-error.component.html',
})
export default class AuthError {
  public readonly error = input<string>();

  public readonly errorLabel = computed(() => this.error()?.replaceAll('_', ' ') ?? null);
}
