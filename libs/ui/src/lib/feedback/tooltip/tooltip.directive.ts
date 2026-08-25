import { Directive, DestroyRef, ElementRef, computed, inject, input, signal } from '@angular/core';
import { Overlay, type ConnectedPosition, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { take } from 'rxjs';

import { TooltipPanel } from './tooltip-panel.component';

const TOOLTIP_POSITIONS: readonly ConnectedPosition[] = [
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
  { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
];

@Directive({
  selector: '[kwdUiTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(focus)': 'show()',
    '(mouseleave)': 'hide()',
    '(blur)': 'hide()',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class Tooltip {
  public readonly kwdUiTooltip = input.required<string>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly overlay = inject(Overlay);

  private readonly tooltipId = `kwd-ui-tooltip-${crypto.randomUUID()}`;
  private readonly visible = signal(false);
  protected readonly describedBy = computed(() => (this.visible() ? this.tooltipId : null));

  private overlayRef: OverlayRef | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  protected show(): void {
    if (this.visible()) return;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([...TOOLTIP_POSITIONS])
      .withViewportMargin(8)
      .withPush(true);

    // threshold avoids closing on the incidental scroll the browser performs to bring an
    // off-screen trigger into view on focus; a real user scroll still exceeds it and closes.
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.close({ threshold: 50 }),
    });
    this.overlayRef
      .detachments()
      .pipe(take(1))
      .subscribe(() => this.hide());

    const panelRef = this.overlayRef.attach(new ComponentPortal(TooltipPanel));
    panelRef.setInput('id', this.tooltipId);
    panelRef.setInput('text', this.kwdUiTooltip());

    this.visible.set(true);
  }

  protected hide(): void {
    if (!this.visible()) return;

    this.visible.set(false);
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
