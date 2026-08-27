import { isPlatformServer } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  REQUEST_CONTEXT,
  TransferState,
  inject,
  makeStateKey,
  signal,
  type Signal,
  type StateKey,
} from '@angular/core';
import type { PublicSocialLink } from '../../pages/home/public-social-link.model';
import { asSocialLinksRequestContext } from '../ssr';

const SOCIAL_LINKS_STATE_KEY: StateKey<readonly PublicSocialLink[]> =
  makeStateKey<readonly PublicSocialLink[]>('public-social-links');

@Injectable({ providedIn: 'root' })
export class SocialLinksService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState: TransferState = inject(TransferState);
  private readonly requestContext = asSocialLinksRequestContext(inject(REQUEST_CONTEXT, { optional: true }));

  public readonly links: Signal<readonly PublicSocialLink[]> = signal(this.resolveLinks());

  private resolveLinks(): readonly PublicSocialLink[] {
    if (isPlatformServer(this.platformId)) {
      const socialLinks = this.requestContext?.socialLinks ?? [];
      this.transferState.set(SOCIAL_LINKS_STATE_KEY, socialLinks);
      return socialLinks;
    }

    return this.transferState.get(SOCIAL_LINKS_STATE_KEY, []);
  }
}
