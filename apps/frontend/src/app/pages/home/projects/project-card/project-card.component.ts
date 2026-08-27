import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare, faCode } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { BrandIcon } from '@shared/ui';

import type { PublicProject } from '../../public-project.model';
import type { ProjectCardVariant, TagChip } from './project-card.types';
import { resolveTagIcon } from './tag-icon.config';

const ARTICLE_FEATURE_CLASSES =
  'grid gap-4 overflow-hidden rounded-(--radius-lg) border border-(--color-outline-variant) bg-(--color-surface-container-low) p-4 sm:h-72 sm:grid-cols-2 sm:items-center sm:p-5';
const ARTICLE_COMPACT_CLASSES =
  'flex gap-4 overflow-hidden rounded-(--radius-lg) border border-(--color-outline-variant) bg-(--color-surface-container-low) p-4';

const IMAGE_WRAPPER_FEATURE_CLASSES =
  'relative aspect-video max-h-56 shrink-0 overflow-hidden rounded-(--radius-md) bg-(--color-surface-container-high)';
const IMAGE_WRAPPER_COMPACT_CLASSES =
  'relative h-20 w-20 shrink-0 overflow-hidden rounded-(--radius-md) bg-(--color-surface-container-high)';

const PLACEHOLDER_ICON_FEATURE_CLASSES = 'text-4xl text-(--color-on-surface-variant)/25';
const PLACEHOLDER_ICON_COMPACT_CLASSES = 'text-xl text-(--color-on-surface-variant)/25';

const BODY_FEATURE_CLASSES = 'flex flex-col gap-2';
const BODY_COMPACT_CLASSES = 'flex min-w-0 flex-1 flex-col gap-1.5';

const DESCRIPTION_FEATURE_CLASSES = 'line-clamp-2 max-w-prose text-body-sm text-(--color-on-surface-variant)';
const DESCRIPTION_COMPACT_CLASSES = 'text-body-sm text-(--color-on-surface-variant)';

const LINKS_FEATURE_CLASSES = 'mt-1 flex flex-wrap items-center gap-3';
const LINKS_COMPACT_CLASSES = 'mt-auto flex flex-wrap gap-3 pt-1 text-body-sm';

const MAX_VISIBLE_FEATURE_TAGS = 4;

const FEATURE_IMAGE_SIZES = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw';

@Component({
  selector: 'kwd-frontend-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, FontAwesomeModule, BrandIcon, TranslatePipe],
  templateUrl: './project-card.component.html',
})
export class ProjectCard {
  public readonly project = input.required<PublicProject>();
  public readonly variant = input<ProjectCardVariant>('feature');

  protected readonly placeholderIcon = faCode;
  protected readonly liveLinkIcon = faArrowUpRightFromSquare;

  protected readonly isFeature: Signal<boolean> = computed(() => this.variant() === 'feature');

  protected readonly tagChips: Signal<readonly TagChip[]> = computed(() =>
    this.project().tags.map((tag) => ({ name: tag, icon: resolveTagIcon(tag) })),
  );

  protected readonly visibleTagChips: Signal<readonly TagChip[]> = computed(() =>
    this.tagChips().slice(0, MAX_VISIBLE_FEATURE_TAGS),
  );

  protected readonly hiddenTagCount: Signal<number> = computed(() =>
    Math.max(this.tagChips().length - MAX_VISIBLE_FEATURE_TAGS, 0),
  );

  protected readonly imageSizes: string = FEATURE_IMAGE_SIZES;

  protected readonly articleClasses: Signal<string> = computed(() =>
    this.isFeature() ? ARTICLE_FEATURE_CLASSES : ARTICLE_COMPACT_CLASSES,
  );

  protected readonly imageWrapperClasses: Signal<string> = computed(() =>
    this.isFeature() ? IMAGE_WRAPPER_FEATURE_CLASSES : IMAGE_WRAPPER_COMPACT_CLASSES,
  );

  protected readonly placeholderIconClasses: Signal<string> = computed(() =>
    this.isFeature() ? PLACEHOLDER_ICON_FEATURE_CLASSES : PLACEHOLDER_ICON_COMPACT_CLASSES,
  );

  protected readonly bodyClasses: Signal<string> = computed(() =>
    this.isFeature() ? BODY_FEATURE_CLASSES : BODY_COMPACT_CLASSES,
  );

  protected readonly descriptionClasses: Signal<string> = computed(() =>
    this.isFeature() ? DESCRIPTION_FEATURE_CLASSES : DESCRIPTION_COMPACT_CLASSES,
  );

  protected readonly linksClasses: Signal<string> = computed(() =>
    this.isFeature() ? LINKS_FEATURE_CLASSES : LINKS_COMPACT_CLASSES,
  );

  protected readonly repoLinkLabelKey: Signal<string> = computed(() =>
    this.isFeature() ? 'projects.card.viewSource' : 'projects.card.source',
  );
}
