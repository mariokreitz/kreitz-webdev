import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from '../../../core/contact';

@Component({
  selector: 'kwd-frontend-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './site-footer.component.html',
})
export class SiteFooter {
  protected readonly currentYear: number = new Date().getFullYear();
  protected readonly contactEmail: string = CONTACT_EMAIL;
  protected readonly githubUrl: string = GITHUB_URL;
  protected readonly linkedinUrl: string = LINKEDIN_URL;
}
