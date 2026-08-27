import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin, faMastodon, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faGlobe, faLink, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, SocialLink } from '../../../../core/api';
import { ToastService } from '../../../../core/toast';
import { WebsiteSocialLinkService, type CreateSocialLinkPayload } from '../../../../core/websites';
import {
  EMPTY_SOCIAL_LINK_FORM_VALUE,
  SocialLinkForm,
  type SocialLinkFormValue,
} from './social-link-form/social-link-form.component';

const PLATFORM_ICONS: Readonly<Record<string, IconDefinition>> = {
  github: faGithub,
  linkedin: faLinkedin,
  x: faXTwitter,
  twitter: faXTwitter,
  mastodon: faMastodon,
  email: faEnvelope,
  website: faGlobe,
};

function resolvePlatformIcon(platform: string): IconDefinition {
  return PLATFORM_ICONS[platform.toLowerCase()] ?? faLink;
}

function toFormValue(socialLink: SocialLink): SocialLinkFormValue {
  return {
    platform: socialLink.platform,
    label: socialLink.label ?? '',
    url: socialLink.url,
    sortOrder: socialLink.sortOrder,
  };
}

function toPayload(value: SocialLinkFormValue): CreateSocialLinkPayload {
  return {
    platform: value.platform,
    ...(value.label !== '' && { label: value.label }),
    url: value.url,
    sortOrder: value.sortOrder,
  };
}

@Component({
  selector: 'kwd-portal-social-links-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton, FontAwesomeModule, TranslatePipe, ConfirmDialog, SocialLinkForm],
  templateUrl: './social-links-section.component.html',
})
export class SocialLinksSection {
  public readonly websiteId = input.required<string>();

  private readonly socialLinkService: WebsiteSocialLinkService = inject(WebsiteSocialLinkService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly addIcon = faPlus;
  protected readonly editIcon = faPen;
  protected readonly deleteIcon = faTrash;

  protected readonly socialLinksResource = httpResource<readonly SocialLink[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites/${this.websiteId()}/social-links`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly SocialLink[]>).data, defaultValue: [] },
  );

  public readonly isAddFormOpen: WritableSignal<boolean> = signal(false);
  public readonly creating: WritableSignal<boolean> = signal(false);
  public readonly updating: WritableSignal<boolean> = signal(false);
  public readonly deleting: WritableSignal<boolean> = signal(false);

  private readonly editingIdSignal: WritableSignal<string | null> = signal(null);
  public readonly editingId: Signal<string | null> = this.editingIdSignal.asReadonly();

  private readonly pendingDeleteSignal: WritableSignal<SocialLink | null> = signal(null);
  public readonly pendingDelete: Signal<SocialLink | null> = this.pendingDeleteSignal.asReadonly();

  protected readonly emptyFormValue = EMPTY_SOCIAL_LINK_FORM_VALUE;

  public iconFor(platform: string): IconDefinition {
    return resolvePlatformIcon(platform);
  }

  public onAddRequested(): void {
    this.editingIdSignal.set(null);
    this.isAddFormOpen.set(true);
  }

  public onAddCancelled(): void {
    this.isAddFormOpen.set(false);
  }

  public async onAddSubmit(value: SocialLinkFormValue): Promise<void> {
    this.creating.set(true);

    try {
      await this.socialLinkService.create(this.websiteId(), toPayload(value));
      this.socialLinksResource.reload();
      this.isAddFormOpen.set(false);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.socialLinks.toast.created'),
      });
    } catch {
      // no-op
    } finally {
      this.creating.set(false);
    }
  }

  public initialValueFor(socialLink: SocialLink): SocialLinkFormValue {
    return toFormValue(socialLink);
  }

  public onEditRequested(socialLink: SocialLink): void {
    this.isAddFormOpen.set(false);
    this.editingIdSignal.set(socialLink.id);
  }

  public onEditCancelled(): void {
    this.editingIdSignal.set(null);
  }

  public async onEditSubmit(socialLink: SocialLink, value: SocialLinkFormValue): Promise<void> {
    this.updating.set(true);

    try {
      await this.socialLinkService.update(this.websiteId(), socialLink.id, toPayload(value));
      this.socialLinksResource.reload();
      this.editingIdSignal.set(null);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.socialLinks.toast.updated'),
      });
    } catch {
      // no-op
    } finally {
      this.updating.set(false);
    }
  }

  public onDeleteRequested(socialLink: SocialLink): void {
    this.pendingDeleteSignal.set(socialLink);
  }

  public onDeleteCancelled(): void {
    this.pendingDeleteSignal.set(null);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const socialLink = this.pendingDeleteSignal();

    if (!socialLink) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.socialLinkService.remove(this.websiteId(), socialLink.id);
      this.socialLinksResource.reload();
      this.pendingDeleteSignal.set(null);
      this.toastService.show({
        severity: 'success',
        message: this.translate.instant('websites.socialLinks.toast.deleted'),
      });
    } catch {
      // no-op
    } finally {
      this.deleting.set(false);
    }
  }
}
