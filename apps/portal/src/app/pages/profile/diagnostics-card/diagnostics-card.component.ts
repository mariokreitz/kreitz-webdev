import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

export interface DiagnosticField {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'kwd-portal-diagnostics-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './diagnostics-card.component.html',
})
export class DiagnosticsCard {
  public readonly fields = input.required<readonly DiagnosticField[]>();

  public readonly terminalIcon = faTerminal;
}
