import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  type OnDestroy,
  type Signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDesktop, faStar } from '@fortawesome/free-solid-svg-icons';

import type { ProjectCategory, PublicProject } from '../../public-project.model';
import { SafeResourceUrlPipe } from './safe-resource-url.pipe';

type PreviewStatus = 'idle' | 'loading' | 'loaded' | 'failed';

const PREVIEW_LOAD_TIMEOUT_MS = 4000;

// WHY: fixed locale (matching this card's hardcoded English labels) rather than `undefined` —
// the latter resolves to Node's ICU default on the server and the visitor's OS/browser locale on
// the client, producing a hydration text mismatch whenever those two differ.
const DATE_FORMAT_LOCALE = 'en-US';

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  DEMO: 'Demo',
  OPEN_SOURCE: 'Open Source',
  POC: 'Proof of Concept',
  MVP: 'MVP',
  PLATFORM: 'Platform',
};

// WHY: reuses the same 5 category-accent tokens established for the skills section (home.component.ts's
// CATEGORY_ACCENTS) — a different taxonomy, so the mapping doesn't need to line up 1:1 with skills' own.
const CATEGORY_CLASSES: Record<ProjectCategory, string> = {
  DEMO: 'border-(--color-info)/50 bg-(--color-info)/10 text-(--color-info)',
  OPEN_SOURCE: 'border-(--color-secondary)/50 bg-(--color-secondary)/10 text-(--color-secondary)',
  POC: 'border-(--color-warning)/50 bg-(--color-warning)/10 text-(--color-warning)',
  MVP: 'border-(--color-primary)/50 bg-(--color-primary)/10 text-(--color-primary)',
  PLATFORM: 'border-(--color-tertiary)/50 bg-(--color-tertiary)/10 text-(--color-tertiary)',
};

@Component({
  selector: 'kwd-frontend-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, FontAwesomeModule, SafeResourceUrlPipe],
  templateUrl: './project-card.component.html',
})
export class ProjectCard implements OnDestroy {
  public readonly project = input.required<PublicProject>();

  public readonly starIcon = faStar;
  public readonly previewToggleIcon = faDesktop;

  public readonly categoryLabel: Signal<string | null> = computed(() => {
    const category = this.project().category;

    return category ? CATEGORY_LABELS[category] : null;
  });

  public readonly categoryClasses: Signal<string | null> = computed(() => {
    const category = this.project().category;

    return category ? CATEGORY_CLASSES[category] : null;
  });

  public readonly createdLabel: Signal<string | null> = computed(() => this.formatDate(this.project().githubCreatedAt));

  public readonly updatedLabel: Signal<string | null> = computed(() => this.formatDate(this.project().githubUpdatedAt));

  public readonly starCount: Signal<number | null> = computed(() => this.project().githubStars ?? null);

  public readonly hasMetadata: Signal<boolean> = computed(
    () => this.createdLabel() !== null || this.updatedLabel() !== null || this.starCount() !== null,
  );

  public readonly previewEligible: Signal<boolean> = computed(() => Boolean(this.project().liveUrl));

  public readonly previewUrl: Signal<string> = computed(() => this.project().liveUrl ?? '');

  public readonly previewHostname: Signal<string> = computed(() => {
    const liveUrl = this.project().liveUrl;

    if (!liveUrl) {
      return '';
    }

    try {
      return new URL(liveUrl).hostname;
    } catch {
      return liveUrl;
    }
  });

  public readonly previewVisible = signal(false);
  public readonly previewStatus = signal<PreviewStatus>('idle');

  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  public ngOnDestroy(): void {
    this.clearPreviewTimeout();
  }

  public onPointerEnter(): void {
    this.showPreview();
  }

  public onPointerLeave(): void {
    this.previewVisible.set(false);
  }

  public onFocusIn(): void {
    this.showPreview();
  }

  public onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    const current = event.currentTarget as Node;

    if (!related || !current.contains(related)) {
      this.previewVisible.set(false);
    }
  }

  public onPreviewToggleClick(): void {
    if (!this.previewEligible()) {
      return;
    }

    this.previewVisible.update((visible) => !visible);

    if (this.previewVisible()) {
      this.startPreviewLoad();
    }
  }

  public onPreviewLoad(): void {
    this.clearPreviewTimeout();
    this.previewStatus.set('loaded');
  }

  public onPreviewError(): void {
    this.clearPreviewTimeout();
    this.previewStatus.set('failed');
  }

  private showPreview(): void {
    if (!this.previewEligible()) {
      return;
    }

    this.previewVisible.set(true);
    this.startPreviewLoad();
  }

  private startPreviewLoad(): void {
    if (this.previewStatus() !== 'idle') {
      return;
    }

    this.previewStatus.set('loading');

    // WHY: an X-Frame-Options/CSP frame-ancestors block rarely fires the iframe's own (error) event, so a load timeout is the only reliable failure detector.
    this.timeoutHandle = setTimeout(() => {
      if (this.previewStatus() === 'loading') {
        this.previewStatus.set('failed');
      }
    }, PREVIEW_LOAD_TIMEOUT_MS);
  }

  private clearPreviewTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private formatDate(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return new Date(value).toLocaleDateString(DATE_FORMAT_LOCALE, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
