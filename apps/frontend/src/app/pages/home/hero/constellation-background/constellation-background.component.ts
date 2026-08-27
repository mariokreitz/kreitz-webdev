import { NgStyle, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrandIcon, Tooltip } from '@shared/ui';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  LineSegments,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

import type { Theme } from '../../../../core/theme';
import type { ConstellationConfig, Skill } from './constellation-background.types';
import { ParticleFieldSimulation, at } from './particle-field-simulation';

interface LineMaterialWithWidth {
  linewidth: number;
}

const DEFAULT_PARTICLE_RADIUS_PX = 24;
const SETTLE_ITERATIONS = 900;
const LINE_ALPHA_FADE_EXPONENT = 0.6;

const LINE_VERTEX_SHADER = `
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

@Component({
  selector: 'kwd-frontend-constellation-background',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pointer-events-none absolute inset-0 block' },
  imports: [FontAwesomeModule, NgStyle, BrandIcon, Tooltip],
  templateUrl: './constellation-background.component.html',
})
export class ConstellationBackground {
  public readonly config = input.required<ConstellationConfig>();
  public readonly theme = input.required<Theme>();

  protected readonly ready = signal(false);

  private readonly hostElementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly skillButtonRefs = viewChildren<ElementRef<HTMLButtonElement>>('skillButton');
  private readonly ngZone: NgZone = inject(NgZone);
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private lineSegments: LineSegments | null = null;
  private lineMaterial: ShaderMaterial | null = null;

  private simulation: ParticleFieldSimulation | null = null;
  private resolvedColors: readonly Color[] = [];
  private cachedButtons: readonly HTMLButtonElement[] = [];
  private particleRadius = DEFAULT_PARTICLE_RADIUS_PX;

  private resizeObserver: ResizeObserver | null = null;
  private animationFrameId: number | null = null;
  private width = 0;
  private height = 0;
  private pixelRatio = 1;
  private reducedMotion = false;

  private pointerX: number | null = null;
  private pointerY: number | null = null;

  private readonly hoveredSkillIndices = new Set<number>();
  private readonly focusedSkillIndices = new Set<number>();

  private readonly onDocumentPointerMove = (event: PointerEvent): void => this.updatePointer(event);
  private readonly onDocumentPointerLeave = (): void => this.clearPointer();

  constructor() {
    afterNextRender(() => this.initialize());

    effect(() => {
      this.cachedButtons = this.skillButtonRefs().map((ref) => ref.nativeElement);
    });

    effect(() => {
      this.theme();
      this.handleThemeChange();
    });

    inject(DestroyRef).onDestroy(() => this.teardown());
  }

  protected accentValue(skill: Skill): string {
    return `var(${skill.accentVariable})`;
  }

  protected onSkillPointerEnter(index: number): void {
    this.hoveredSkillIndices.add(index);
  }

  protected onSkillPointerLeave(index: number): void {
    this.hoveredSkillIndices.delete(index);
  }

  protected onSkillFocus(index: number): void {
    this.focusedSkillIndices.add(index);
  }

  protected onSkillBlur(index: number): void {
    this.focusedSkillIndices.delete(index);
  }

  private isFrozen(index: number): boolean {
    return this.hoveredSkillIndices.has(index) || this.focusedSkillIndices.has(index);
  }

  private initialize(): void {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = this.canvasRef().nativeElement;
    this.scene = new Scene();
    this.camera = new OrthographicCamera(0, 1, 0, 1, -1000, 1000);
    this.camera.position.z = 1;

    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);

    if (!this.reducedMotion && this.config().mouse.enabled) {
      document.addEventListener('pointermove', this.onDocumentPointerMove);
      document.addEventListener('pointerleave', this.onDocumentPointerLeave);
    }

    this.resizeObserver = new ResizeObserver((entries) => this.handleResize(entries));
    this.resizeObserver.observe(this.hostElementRef.nativeElement);
  }

  private handleResize(entries: readonly ResizeObserverEntry[]): void {
    const rect = entries[entries.length - 1]?.contentRect;
    const width = rect ? rect.width : this.hostElementRef.nativeElement.clientWidth;
    const height = rect ? rect.height : this.hostElementRef.nativeElement.clientHeight;

    if (width <= 0 || height <= 0 || !this.renderer || !this.camera) {
      return;
    }

    const previousWidth = this.width;
    const previousHeight = this.height;

    this.pixelRatio = window.devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    this.particleRadius = this.measureParticleRadius();

    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height);
    this.camera.right = width;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();

    if (!this.simulation) {
      const cfg = this.config();
      this.simulation = new ParticleFieldSimulation(
        cfg.skills.length,
        width,
        height,
        this.particleRadius,
        cfg.baseSpeed,
      );
      this.buildLines();
      this.resolveAndCacheColors();
      this.settleInitialLayout();
      this.rebuildLineSegments();
      this.applyDomPositions();
      this.renderFrameOnce();
      this.markReady();

      if (!this.reducedMotion) {
        this.startAnimationLoop();
      }

      return;
    }

    this.simulation.rescaleToBounds(previousWidth, previousHeight, width, height, this.particleRadius);

    if (this.reducedMotion) {
      this.settleInitialLayout();
      this.rebuildLineSegments();
      this.applyDomPositions();
      this.renderFrameOnce();
    }
  }

  private measureParticleRadius(): number {
    const first = this.cachedButtons[0];
    return first ? first.offsetWidth / 2 : this.particleRadius;
  }

  private settleInitialLayout(): void {
    for (let i = 0; i < SETTLE_ITERATIONS; i++) {
      this.stepSimulation();
    }
  }

  private stepSimulation(): void {
    this.simulation?.step({
      config: this.config(),
      width: this.width,
      height: this.height,
      particleRadius: this.particleRadius,
      pointerX: this.pointerX,
      pointerY: this.pointerY,
      isFrozen: (index) => this.isFrozen(index),
    });
  }

  private buildLines(): void {
    const field = this.simulation?.field;
    if (!field) return;

    const count = field.count;
    const maxSegments = (count * (count - 1)) / 2;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(maxSegments * 2 * 3), 3));
    geometry.setAttribute('aColor', new BufferAttribute(new Float32Array(maxSegments * 2 * 3), 3));
    geometry.setAttribute('aAlpha', new BufferAttribute(new Float32Array(maxSegments * 2), 1));
    geometry.setDrawRange(0, 0);

    const material = new ShaderMaterial({
      vertexShader: LINE_VERTEX_SHADER,
      fragmentShader: LINE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });

    (material as unknown as LineMaterialWithWidth).linewidth = this.config().lineWidth;

    this.lineMaterial = material;
    this.lineSegments = new LineSegments(geometry, material);
    this.scene?.add(this.lineSegments);
  }

  private resolveColors(): readonly Color[] {
    const style = getComputedStyle(document.documentElement);
    const cache = new Map<string, Color>();

    return this.config().skills.map((skill) => {
      const cached = cache.get(skill.accentVariable);
      if (cached) return cached;

      const value = style.getPropertyValue(skill.accentVariable).trim();
      const color = new Color(value || '#ffffff');
      cache.set(skill.accentVariable, color);
      return color;
    });
  }

  private resolveAndCacheColors(): void {
    this.resolvedColors = this.resolveColors();
  }

  private handleThemeChange(): void {
    if (!this.simulation) return;

    this.resolveAndCacheColors();
    this.rebuildLineSegments();
    this.renderFrameOnce();
  }

  private rebuildLineSegments(): void {
    const field = this.simulation?.field;
    if (!field || !this.lineSegments) return;

    const cfg = this.config();
    const { positions, count } = field;
    const geometry = this.lineSegments.geometry;
    const positionAttr = geometry.getAttribute('position') as BufferAttribute;
    const colorAttr = geometry.getAttribute('aColor') as BufferAttribute;
    const alphaAttr = geometry.getAttribute('aAlpha') as BufferAttribute;
    const positionArray = positionAttr.array as Float32Array;
    const colorArray = colorAttr.array as Float32Array;
    const alphaArray = alphaAttr.array as Float32Array;
    const linkDistance = cfg.linkDistance;

    let vertexIndex = 0;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const xi = at(positions, ix);
      const yi = at(positions, ix + 1);

      for (let j = i + 1; j < count; j++) {
        const jx = j * 3;
        const xj = at(positions, jx);
        const yj = at(positions, jx + 1);
        const dx = xi - xj;
        const dy = yi - yj;
        const distance = Math.hypot(dx, dy);

        if (distance >= linkDistance) continue;

        const alpha = Math.pow(1 - distance / linkDistance, LINE_ALPHA_FADE_EXPONENT) * cfg.lineOpacity;
        const colorA = this.resolvedColors[i] ?? this.resolvedColors[0];
        const colorB = this.resolvedColors[j] ?? this.resolvedColors[0];
        if (!colorA || !colorB) continue;
        const r = (colorA.r + colorB.r) / 2;
        const g = (colorA.g + colorB.g) / 2;
        const b = (colorA.b + colorB.b) / 2;

        const base = vertexIndex * 3;
        positionArray[base] = xi;
        positionArray[base + 1] = yi;
        positionArray[base + 2] = 0;
        positionArray[base + 3] = xj;
        positionArray[base + 4] = yj;
        positionArray[base + 5] = 0;

        colorArray[base] = r;
        colorArray[base + 1] = g;
        colorArray[base + 2] = b;
        colorArray[base + 3] = r;
        colorArray[base + 4] = g;
        colorArray[base + 5] = b;

        alphaArray[vertexIndex] = alpha;
        alphaArray[vertexIndex + 1] = alpha;

        vertexIndex += 2;
      }
    }

    geometry.setDrawRange(0, vertexIndex);
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }

  private applyDomPositions(): void {
    const field = this.simulation?.field;
    if (!field) return;

    const half = this.particleRadius;
    const buttons = this.cachedButtons;
    const positions = field.positions;

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      if (!button) continue;

      const ix = i * 3;
      const x = at(positions, ix) - half;
      const y = at(positions, ix + 1) - half;
      button.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) return;

    this.ngZone.runOutsideAngular(() => {
      const step = (): void => {
        this.stepSimulation();
        this.rebuildLineSegments();
        this.applyDomPositions();
        this.renderFrameOnce();
        this.animationFrameId = requestAnimationFrame(step);
      };

      this.animationFrameId = requestAnimationFrame(step);
    });
  }

  private renderFrameOnce(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private markReady(): void {
    if (this.ready()) return;
    this.ngZone.run(() => this.ready.set(true));
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.hostElementRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      this.clearPointer();
      return;
    }

    this.pointerX = x;
    this.pointerY = y;
  }

  private clearPointer(): void {
    this.pointerX = null;
    this.pointerY = null;
  }

  private teardown(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.isBrowser) {
      document.removeEventListener('pointermove', this.onDocumentPointerMove);
      document.removeEventListener('pointerleave', this.onDocumentPointerLeave);
    }

    this.lineSegments?.geometry.dispose();
    this.lineMaterial?.dispose();
    this.renderer?.dispose();

    this.lineSegments = null;
    this.lineMaterial = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.simulation = null;
  }
}
