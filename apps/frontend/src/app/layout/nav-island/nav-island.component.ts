import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  NgZone,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { filter } from 'rxjs';
import { CvAvailabilityService } from '../../core/cv';
import { ThemeService, type Theme } from '../../core/theme';
import { NAV_BOUNCE_MS } from './blip-mascot/blip-mascot.config';
import { BlipMascot } from './blip-mascot/blip-mascot.component';
import type { SectionId, SectionTarget } from './nav-island.types';

const ANCHOR_SCROLL_OFFSET_PX = 96;
const SCROLLED_THRESHOLD_PX = 24;
const SECTION_IDS: readonly SectionId[] = ['projects', 'contact'];
const SECTION_ROOT_MARGIN = '-40% 0px -55% 0px';

@Component({
  selector: 'kwd-frontend-nav-island',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, RouterLink, BlipMascot],
  templateUrl: './nav-island.component.html',
})
export class NavIsland {
  private readonly cvAvailabilityService: CvAvailabilityService = inject(CvAvailabilityService);
  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly viewportScroller: ViewportScroller = inject(ViewportScroller);
  private readonly router: Router = inject(Router);
  private readonly ngZone: NgZone = inject(NgZone);
  private readonly injector: Injector = inject(Injector);

  private readonly scrolledSignal: WritableSignal<boolean> = signal(false);
  private readonly activeSectionSignal: WritableSignal<SectionId | null> = signal(null);
  private readonly navBounceSignal: WritableSignal<boolean> = signal(false);
  private readonly intersectingSections = new Set<SectionId>();

  private readonly blip = viewChild.required(BlipMascot);

  private sectionObserver: IntersectionObserver | null = null;
  private stopScrollTracking: (() => void) | null = null;

  private navBounceTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly scrolled: Signal<boolean> = this.scrolledSignal.asReadonly();
  protected readonly activeSection: Signal<SectionId | null> = this.activeSectionSignal.asReadonly();
  protected readonly cvAvailable: Signal<boolean> = this.cvAvailabilityService.available;
  protected readonly downloadIcon: IconDefinition = faDownload;
  protected readonly theme: Signal<Theme> = computed(() => this.themeService.theme());
  protected readonly navBounce: Signal<boolean> = this.navBounceSignal.asReadonly();

  constructor() {
    this.viewportScroller.setOffset([0, ANCHOR_SCROLL_OFFSET_PX]);

    afterNextRender(() => this.initializeScrollTracking());
    afterNextRender(() => this.observeSections());

    effect(() => {
      if (this.activeSection() !== null) this.triggerNavBounce();
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.resetSectionTracking());

    inject(DestroyRef).onDestroy(() => {
      this.stopScrollTracking?.();
      this.sectionObserver?.disconnect();
      clearTimeout(this.navBounceTimer);
    });
  }

  protected isSectionActive(section: SectionId): boolean {
    return this.activeSection() === section;
  }

  protected onNavLinkClick(): void {
    this.triggerNavBounce();
  }

  protected onNavLinkPointerEnter(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const linkCenterX = target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2;
    this.blip().reactToNavHover(linkCenterX);
  }

  protected onNavLinkPointerLeave(): void {
    this.blip().clearNavHover();
  }

  private initializeScrollTracking(): void {
    this.updateScrolled();

    const listener = (): void => this.updateScrolled();
    this.ngZone.runOutsideAngular(() => window.addEventListener('scroll', listener, { passive: true }));
    this.stopScrollTracking = () => window.removeEventListener('scroll', listener);
  }

  private updateScrolled(): void {
    const next = window.scrollY > SCROLLED_THRESHOLD_PX;
    if (next === this.scrolledSignal()) return;

    this.ngZone.run(() => this.scrolledSignal.set(next));
  }

  private resetSectionTracking(): void {
    this.activeSectionSignal.set(null);
    afterNextRender(() => this.observeSections(), { injector: this.injector });
  }

  private observeSections(): void {
    this.sectionObserver?.disconnect();
    this.intersectingSections.clear();

    const targets = this.resolveSectionTargets();
    if (targets.length === 0) return;

    this.sectionObserver = new IntersectionObserver((entries) => this.handleIntersections(entries, targets), {
      rootMargin: SECTION_ROOT_MARGIN,
    });

    targets.forEach(({ element }) => this.sectionObserver?.observe(element));
  }

  private resolveSectionTargets(): readonly SectionTarget[] {
    return SECTION_IDS.map((id) => ({ id, element: document.getElementById(id) })).filter(
      (target): target is SectionTarget => target.element !== null,
    );
  }

  private handleIntersections(entries: readonly IntersectionObserverEntry[], targets: readonly SectionTarget[]): void {
    for (const entry of entries) {
      const match = targets.find((target) => target.element === entry.target);
      if (!match) continue;

      if (entry.isIntersecting) {
        this.intersectingSections.add(match.id);
      } else {
        this.intersectingSections.delete(match.id);
      }
    }

    const active = SECTION_IDS.find((id) => this.intersectingSections.has(id)) ?? null;
    this.activeSectionSignal.set(active);
  }

  private triggerNavBounce(): void {
    clearTimeout(this.navBounceTimer);
    this.navBounceSignal.set(true);
    this.navBounceTimer = setTimeout(() => this.navBounceSignal.set(false), NAV_BOUNCE_MS);
  }
}
