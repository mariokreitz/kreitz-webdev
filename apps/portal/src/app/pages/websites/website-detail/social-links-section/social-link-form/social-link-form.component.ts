import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import * as z from 'zod';

const KNOWN_PLATFORMS = ['github', 'linkedin', 'x', 'mastodon', 'email', 'website'] as const;

const PLATFORM_PRESETS: readonly { readonly value: string; readonly labelKey: string }[] = [
  { value: 'github', labelKey: 'websites.socialLinks.platforms.github' },
  { value: 'linkedin', labelKey: 'websites.socialLinks.platforms.linkedin' },
  { value: 'x', labelKey: 'websites.socialLinks.platforms.x' },
  { value: 'mastodon', labelKey: 'websites.socialLinks.platforms.mastodon' },
  { value: 'email', labelKey: 'websites.socialLinks.platforms.email' },
  { value: 'website', labelKey: 'websites.socialLinks.platforms.website' },
];

const OTHER_PRESET = 'other';

const socialLinkFormSchema = z.object({
  platform: z
    .string()
    .min(1, 'websites.socialLinks.form.errors.platformRequired')
    .max(50, 'websites.socialLinks.form.errors.platformTooLong'),
  label: z.string().max(200, 'websites.socialLinks.form.errors.labelTooLong'),
  url: z.url('websites.socialLinks.form.errors.urlInvalid'),
  sortOrder: z
    .number()
    .int('websites.socialLinks.form.errors.sortOrderInvalid')
    .min(0, 'websites.socialLinks.form.errors.sortOrderInvalid'),
});

export type SocialLinkFormValue = z.infer<typeof socialLinkFormSchema>;

export const EMPTY_SOCIAL_LINK_FORM_VALUE: SocialLinkFormValue = {
  platform: '',
  label: '',
  url: '',
  sortOrder: 0,
};

function presetFor(platform: string): string {
  if (platform === '') {
    return '';
  }

  return (KNOWN_PLATFORMS as readonly string[]).includes(platform) ? platform : OTHER_PRESET;
}

@Component({
  selector: 'kwd-portal-social-link-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, FontAwesomeModule, TranslatePipe],
  templateUrl: './social-link-form.component.html',
})
export class SocialLinkForm {
  public readonly mode = input.required<'create' | 'edit'>();
  public readonly initialValue = input<SocialLinkFormValue>(EMPTY_SOCIAL_LINK_FORM_VALUE);
  public readonly loading = input(false);

  public readonly formSubmitted = output<SocialLinkFormValue>();
  public readonly cancelled = output();

  protected readonly isEdit = computed(() => this.mode() === 'edit');
  protected readonly submitIcon = computed(() => (this.isEdit() ? faCheck : faPlus));
  protected readonly cancelIcon = faXmark;

  protected readonly platformPresets = PLATFORM_PRESETS;
  protected readonly otherPreset = OTHER_PRESET;
  protected readonly selectedPreset = signal('');

  protected readonly formModel = signal<SocialLinkFormValue>(EMPTY_SOCIAL_LINK_FORM_VALUE);
  protected readonly socialLinkForm = form(this.formModel, (path) => {
    validateStandardSchema(path, socialLinkFormSchema);
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      untracked(() => {
        this.formModel.set(initialValue);
        this.socialLinkForm().reset();
        this.selectedPreset.set(presetFor(initialValue.platform));
      });
    });
  }

  public onPresetChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.selectedPreset.set(value);
    this.formModel.update((current) => ({ ...current, platform: value === OTHER_PRESET ? '' : value }));
  }

  public async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.socialLinkForm, async () => {
      this.formSubmitted.emit(this.formModel());
    });
  }

  public onCancel(): void {
    if (this.loading()) {
      return;
    }

    this.cancelled.emit();
  }
}
