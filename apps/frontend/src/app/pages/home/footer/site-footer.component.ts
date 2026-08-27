import { ChangeDetectionStrategy, Component, inject, type Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TranslatePipe } from '@ngx-translate/core';

import { AUTHOR_NAME } from '../../../core/seo';
import { SocialLinksService } from '../../../core/social-links';
import type { PublicSocialLink } from '../public-social-link.model';
import { socialLinkHref, socialLinkIcon, socialLinkLabel, socialLinkTarget } from '../social-link-display';

@Component({
  selector: 'kwd-frontend-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FontAwesomeModule, TranslatePipe],
  templateUrl: './site-footer.component.html',
})
export class SiteFooter {
  private readonly socialLinksService: SocialLinksService = inject(SocialLinksService);

  protected readonly currentYear: number = new Date().getFullYear();
  protected readonly authorName: string = AUTHOR_NAME;
  protected readonly socialLinks: Signal<readonly PublicSocialLink[]> = this.socialLinksService.links;

  protected iconFor(link: PublicSocialLink): IconDefinition {
    return socialLinkIcon(link.platform);
  }

  protected labelFor(link: PublicSocialLink): string {
    return socialLinkLabel(link);
  }

  protected hrefFor(link: PublicSocialLink): string {
    return socialLinkHref(link);
  }

  protected targetFor(link: PublicSocialLink): '_blank' | null {
    return socialLinkTarget(link);
  }

  protected umamiEventFor(link: PublicSocialLink): string {
    return `${link.platform.toLowerCase()}-link`;
  }
}
