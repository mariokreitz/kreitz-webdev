import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  type InputSignal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type { Theme } from '../../../core/theme';
import {
  ATTENTION_RADIUS_PX,
  ATTENTION_SPAN_MS,
  IDLE_BLINK_DELAY_RANGE_MS,
  IDLE_BLINK_DURATION_MS,
  IDLE_BLINK_MIN_DELAY_MS,
  MAX_PUPIL_OFFSET_PX,
  MICRO_BREAK_BLINK_MS,
  MICRO_BREAK_TOTAL_MS,
  NAV_HOVER_GLANCE_PX,
  SCROLL_DUCK_DECAY_MS,
  THEME_SLEEPY_MS,
  THEME_SQUINT_MS,
} from './blip-mascot.config';
import type { BlipEyeState, PupilDriver } from './blip-mascot.types';

const RESTING_MOUTH_PATH = 'M 15 29 Q 22 33 29 29';
const GRIN_MOUTH_PATH = 'M 14 28 Q 22 35.5 30 28';

interface PupilOffset {
  readonly x: number;
  readonly y: number;
}

const IDLE_PUPIL_OFFSET: PupilOffset = { x: 0, y: 0 };
const PUPIL_DRIVER_PRIORITY: readonly PupilDriver[] = ['microBreak', 'ambient', 'navHover', 'scrolling'];

@Component({
  selector: 'kwd-frontend-blip-mascot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'blip-mascot block h-full w-full',
    '[class.is-bouncing]': 'bouncing()',
    '[class.is-ducking]': 'ducking()',
  },
  templateUrl: './blip-mascot.component.html',
})
export class BlipMascot {
  public readonly bouncing: InputSignal<boolean> = input(false);
  public readonly theme: InputSignal<Theme | null> = input<Theme | null>(null);

  protected readonly mouthPath: Signal<string> = computed(() =>
    this.bouncing() ? GRIN_MOUTH_PATH : RESTING_MOUTH_PATH,
  );

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly ngZone: NgZone = inject(NgZone);

  private readonly eyeStateSignal: WritableSignal<BlipEyeState> = signal('open');
  private readonly duckingSignal: WritableSignal<boolean> = signal(false);

  protected readonly eyeState: Signal<BlipEyeState> = this.eyeStateSignal.asReadonly();
  protected readonly ducking: Signal<boolean> = this.duckingSignal.asReadonly();

  private readonly pupilOffsets = new Map<PupilDriver, PupilOffset>();

  private reducedMotion = false;
  private themeInitialized = false;
  private lastScrollY = 0;
  private pointerEngagedSince: number | null = null;
  private pointerOnMicroBreak = false;
  private navHoverEngaged = false;

  private stopPointerTracking: (() => void) | null = null;
  private stopScrollTracking: (() => void) | null = null;

  private blinkLoopTimer: ReturnType<typeof setTimeout> | undefined;
  private microBreakBlinkTimer: ReturnType<typeof setTimeout> | undefined;
  private microBreakEndTimer: ReturnType<typeof setTimeout> | undefined;
  private scrollDuckTimer: ReturnType<typeof setTimeout> | undefined;
  private themeReactionTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => this.initializeInteractions());

    effect(() => {
      const current = this.theme();
      if (current === null) return;
      if (!this.themeInitialized) {
        this.themeInitialized = true;
        return;
      }
      this.reactToThemeChange(current);
    });

    inject(DestroyRef).onDestroy(() => {
      this.stopPointerTracking?.();
      this.stopScrollTracking?.();
      clearTimeout(this.blinkLoopTimer);
      clearTimeout(this.microBreakBlinkTimer);
      clearTimeout(this.microBreakEndTimer);
      clearTimeout(this.scrollDuckTimer);
      clearTimeout(this.themeReactionTimer);
    });
  }

  public reactToNavHover(targetClientX: number): void {
    if (this.reducedMotion || this.pointerEngagedSince !== null) return;

    const direction = Math.sign(targetClientX - this.getCenter().x);
    this.navHoverEngaged = true;
    this.setDriverOffset('navHover', { x: direction * NAV_HOVER_GLANCE_PX, y: 0 });
  }

  public clearNavHover(): void {
    if (!this.navHoverEngaged) return;

    this.navHoverEngaged = false;
    this.clearDriverOffset('navHover');
  }

  private initializeInteractions(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reducedMotion) return;

    this.ngZone.runOutsideAngular(() => {
      const pointerListener = (event: PointerEvent): void => this.handlePointerMove(event);
      window.addEventListener('pointermove', pointerListener, { passive: true });
      this.stopPointerTracking = () => window.removeEventListener('pointermove', pointerListener);

      this.lastScrollY = window.scrollY;
      const scrollListener = (): void => this.handleScrollGlance();
      window.addEventListener('scroll', scrollListener, { passive: true });
      this.stopScrollTracking = () => window.removeEventListener('scroll', scrollListener);
    });

    this.scheduleIdleBlink();
  }

  private handlePointerMove(event: PointerEvent): void {
    const center = this.getCenter();
    const dx = event.clientX - center.x;
    const dy = event.clientY - center.y;
    const distance = Math.hypot(dx, dy);

    if (distance > ATTENTION_RADIUS_PX) {
      if (this.pointerEngagedSince !== null) {
        this.pointerEngagedSince = null;
        this.forceIdlePupil();
      }
      return;
    }

    if (this.pointerEngagedSince === null) this.pointerEngagedSince = performance.now();
    if (this.pointerOnMicroBreak) return;

    const engagedFor = performance.now() - this.pointerEngagedSince;
    if (engagedFor > ATTENTION_SPAN_MS) {
      this.startMicroBreak();
      return;
    }

    const pull = Math.min(1, distance / ATTENTION_RADIUS_PX);
    const angle = Math.atan2(dy, dx);
    this.setDriverOffset('ambient', {
      x: Math.cos(angle) * MAX_PUPIL_OFFSET_PX * pull,
      y: Math.sin(angle) * MAX_PUPIL_OFFSET_PX * pull,
    });
  }

  private startMicroBreak(): void {
    this.pointerOnMicroBreak = true;
    this.ngZone.run(() => this.eyeStateSignal.set('blinking'));

    const awayX = (Math.random() - 0.5) * 2 * MAX_PUPIL_OFFSET_PX;
    const awayY = (Math.random() - 0.5) * MAX_PUPIL_OFFSET_PX;

    this.microBreakBlinkTimer = setTimeout(() => {
      this.ngZone.run(() => this.eyeStateSignal.set('open'));
      this.setDriverOffset('microBreak', { x: awayX, y: awayY });
    }, MICRO_BREAK_BLINK_MS);

    this.microBreakEndTimer = setTimeout(() => {
      this.pointerOnMicroBreak = false;
      this.pointerEngagedSince = performance.now();
      this.forceIdlePupil();
    }, MICRO_BREAK_TOTAL_MS);
  }

  private handleScrollGlance(): void {
    const currentY = window.scrollY;
    const delta = currentY - this.lastScrollY;
    this.lastScrollY = currentY;
    if (delta === 0) return;

    this.setDriverOffset('scrolling', { x: 0, y: delta > 0 ? MAX_PUPIL_OFFSET_PX : -MAX_PUPIL_OFFSET_PX });
    this.ngZone.run(() => this.duckingSignal.set(true));

    clearTimeout(this.scrollDuckTimer);
    this.scrollDuckTimer = setTimeout(() => {
      this.ngZone.run(() => this.duckingSignal.set(false));
      this.clearDriverOffset('scrolling');
    }, SCROLL_DUCK_DECAY_MS);
  }

  private reactToThemeChange(theme: Theme): void {
    if (this.reducedMotion) return;

    clearTimeout(this.themeReactionTimer);
    if (theme === 'light') {
      this.eyeStateSignal.set('squinting');
      this.themeReactionTimer = setTimeout(() => this.eyeStateSignal.set('open'), THEME_SQUINT_MS);
      return;
    }

    this.eyeStateSignal.set('sleepy');
    this.themeReactionTimer = setTimeout(() => this.eyeStateSignal.set('open'), THEME_SLEEPY_MS);
  }

  private scheduleIdleBlink(): void {
    const delay = IDLE_BLINK_MIN_DELAY_MS + Math.random() * IDLE_BLINK_DELAY_RANGE_MS;

    this.blinkLoopTimer = setTimeout(() => {
      if (!this.pointerOnMicroBreak) {
        this.ngZone.run(() => this.eyeStateSignal.set('blinking'));
        setTimeout(() => this.ngZone.run(() => this.eyeStateSignal.set('open')), IDLE_BLINK_DURATION_MS);
      }
      this.scheduleIdleBlink();
    }, delay);
  }

  private setDriverOffset(driver: PupilDriver, offset: PupilOffset): void {
    this.pupilOffsets.set(driver, offset);
    this.applyPupilOffset();
  }

  private clearDriverOffset(driver: PupilDriver): void {
    this.pupilOffsets.delete(driver);
    this.applyPupilOffset();
  }

  private forceIdlePupil(): void {
    this.pupilOffsets.clear();
    this.applyPupilOffset();
  }

  private applyPupilOffset(): void {
    const activeDriver = PUPIL_DRIVER_PRIORITY.find((candidate) => this.pupilOffsets.has(candidate));
    const offset = activeDriver ? (this.pupilOffsets.get(activeDriver) ?? IDLE_PUPIL_OFFSET) : IDLE_PUPIL_OFFSET;

    const style = this.elementRef.nativeElement.style;
    style.setProperty('--pupil-x', `${offset.x}px`);
    style.setProperty('--pupil-y', `${offset.y}px`);
  }

  private getCenter(): PupilOffset {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
}
