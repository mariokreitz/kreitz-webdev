import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
  type ElementRef,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from '../../../core/contact';
import type { Theme } from '../../../core/theme';
import { ConstellationBackground } from './constellation-background/constellation-background.component';
import type { ConstellationConfig, ExclusionZone } from './constellation-background/constellation-background.types';

const TEXT_EXCLUSION_PADDING_PX = 20;
const NAV_EXCLUSION_PADDING_PX = 12;
const NAV_SELECTOR = '#site-nav';

@Component({
  selector: 'kwd-frontend-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, ConstellationBackground],
  templateUrl: './hero.component.html',
})
export class Hero {
  public readonly constellationConfig = input.required<ConstellationConfig>();
  public readonly theme = input.required<Theme>();

  protected readonly contactEmail: string = CONTACT_EMAIL;
  protected readonly githubUrl: string = GITHUB_URL;
  protected readonly linkedinUrl: string = LINKEDIN_URL;

  private readonly sectionRef = viewChild.required<ElementRef<HTMLElement>>('heroSection');
  private readonly textRef = viewChild.required<ElementRef<HTMLElement>>('heroText');

  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly measuredTextZone: WritableSignal<ExclusionZone | null> = signal(null);
  private readonly measuredNavZone: WritableSignal<ExclusionZone | null> = signal(null);
  private resizeObserver: ResizeObserver | null = null;

  protected readonly effectiveConfig: Signal<ConstellationConfig> = computed(() => {
    const config = this.constellationConfig();

    return {
      ...config,
      textExclusionZone: this.measuredTextZone() ?? config.textExclusionZone,
      navExclusionZone: this.measuredNavZone() ?? config.navExclusionZone,
    };
  });

  constructor() {
    afterNextRender(() => this.initializeExclusionZones());
    inject(DestroyRef).onDestroy(() => this.resizeObserver?.disconnect());
  }

  private initializeExclusionZones(): void {
    this.measureExclusionZones();

    this.resizeObserver = new ResizeObserver(() => this.measureExclusionZones());
    this.resizeObserver.observe(this.sectionRef().nativeElement);
    this.resizeObserver.observe(this.textRef().nativeElement);

    const nav = this.queryNavElement();
    if (nav) {
      this.resizeObserver.observe(nav);
    }
  }

  private queryNavElement(): HTMLElement | null {
    return this.isBrowser ? document.querySelector<HTMLElement>(NAV_SELECTOR) : null;
  }

  private measureExclusionZones(): void {
    const sectionRect = this.sectionRef().nativeElement.getBoundingClientRect();

    this.measuredTextZone.set(this.measureTextZone(sectionRect));
    this.measuredNavZone.set(this.measureNavZone(sectionRect));
  }

  private measureTextZone(sectionRect: DOMRect): ExclusionZone | null {
    const base = this.constellationConfig().textExclusionZone;
    if (!base) return null;

    const textRect = this.textRef().nativeElement.getBoundingClientRect();

    return {
      x: textRect.left - sectionRect.left - TEXT_EXCLUSION_PADDING_PX,
      y: textRect.top - sectionRect.top - TEXT_EXCLUSION_PADDING_PX,
      width: textRect.width + TEXT_EXCLUSION_PADDING_PX * 2,
      height: textRect.height + TEXT_EXCLUSION_PADDING_PX * 2,
      force: base.force,
      margin: base.margin,
    };
  }

  private measureNavZone(sectionRect: DOMRect): ExclusionZone | null {
    const base = this.constellationConfig().navExclusionZone;
    const nav = this.queryNavElement();
    if (!base || !nav) return null;

    const navRect = nav.getBoundingClientRect();
    const bottom = navRect.bottom - sectionRect.top + NAV_EXCLUSION_PADDING_PX;
    if (bottom <= 0) return null;

    return {
      x: navRect.left - sectionRect.left - NAV_EXCLUSION_PADDING_PX,
      y: -bottom,
      width: navRect.width + NAV_EXCLUSION_PADDING_PX * 2,
      height: bottom * 2,
      force: base.force,
      margin: base.margin,
    };
  }
}
