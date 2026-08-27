import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from '../../../core/contact';
import { AUTHOR_NAME } from '../../../core/seo';

@Component({
  selector: 'kwd-frontend-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FontAwesomeModule, TranslatePipe],
  templateUrl: './site-footer.component.html',
})
export class SiteFooter {
  protected readonly currentYear: number = new Date().getFullYear();
  protected readonly authorName: string = AUTHOR_NAME;
  protected readonly contactEmail: string = CONTACT_EMAIL;
  protected readonly githubUrl: string = GITHUB_URL;
  protected readonly linkedinUrl: string = LINKEDIN_URL;
  protected readonly faGithub = faGithub;
  protected readonly faLinkedin = faLinkedin;
  protected readonly faEnvelope = faEnvelope;
}
