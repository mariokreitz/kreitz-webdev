import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-frontend-legal-page-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, RouterLink, FontAwesomeModule],
  templateUrl: './legal-page-shell.component.html',
})
export class LegalPageShell {
  protected readonly faArrowLeft = faArrowLeft;
}
