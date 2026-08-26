import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-frontend-cv-download',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './cv-download.component.html',
})
export class CvDownload {
  public readonly available = input.required<boolean>();

  protected readonly downloadIcon = faDownload;
}
