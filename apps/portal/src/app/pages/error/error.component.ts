import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorDiagnostics } from './error-diagnostics/error-diagnostics.component';

const SERVER_ERROR_KEY = 'error.messages.server';
const NETWORK_ERROR_KEY = 'error.messages.network';
const NAVIGATION_ERROR_KEY = 'error.messages.navigation';
const GENERIC_ERROR_KEY = 'error.messages.generic';

@Component({
  selector: 'kwd-portal-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, ErrorDiagnostics, TranslatePipe],
  templateUrl: './error.component.html',
})
export default class ErrorPage {
  public readonly requestId = input<string>();
  public readonly statusCode = input<string>();
  public readonly timestamp = input<string>();
  public readonly path = input<string>();

  public readonly message = computed(() => {
    const code = Number(this.statusCode());

    if (Number.isFinite(code) && code >= 500) {
      return SERVER_ERROR_KEY;
    }

    if (this.statusCode() === '0') {
      return NETWORK_ERROR_KEY;
    }

    if (this.path()) {
      return NAVIGATION_ERROR_KEY;
    }

    return GENERIC_ERROR_KEY;
  });
}
