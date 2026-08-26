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

import { ThemeService } from '../../../../core/theme/theme.service';
import type { ConstellationConfig, ExclusionZone, Skill } from './constellation-background.types';

interface ParticleField {
  readonly positions: Float32Array;
  readonly ambientVelocities: Float32Array;
  readonly pushVelocities: Float32Array;
  readonly count: number;
}

interface LineMaterialWithWidth {
  linewidth: number;
}

const DEFAULT_PARTICLE_RADIUS_PX = 24;
const SEPARATION_PADDING_PX = 8;
const SEPARATION_STRENGTH = 0.5;
const SETTLE_ITERATIONS = 900;
const AMBIENT_JITTER_PER_FRAME = 0.03;
const AMBIENT_SPEED_FLOOR_RATIO = 0.4;
const AMBIENT_SPEED_CEILING_RATIO = 1.6;
const EDGE_REPULSION_MARGIN_PX = 64;
const EDGE_REPULSION_FORCE = 0.25;
const LINE_ALPHA_FADE_EXPONENT = 0.6;

function at(array: Float32Array, index: number): number {
  return array[index] ?? 0;
}

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

  protected readonly ready = signal(false);

  private readonly hostElementRef: ElementRef<HTMLElement> = inject(ElementRef<HTMLElement>);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly skillButtonRefs = viewChildren<ElementRef<HTMLButtonElement>>('skillButton');
  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly ngZone: NgZone = inject(NgZone);
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private lineSegments: LineSegments | null = null;
  private lineMaterial: ShaderMaterial | null = null;

  private field: ParticleField | null = null;
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
      this.themeService.theme();
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

    if (!this.field) {
      this.field = this.buildParticleField(width, height);
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

    this.rescaleParticlesToBounds(previousWidth, previousHeight, width, height);

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
    const iterations = this.reducedMotion ? SETTLE_ITERATIONS : 1;

    for (let i = 0; i < iterations; i++) {
      this.integrate();
    }
  }

  private buildParticleField(width: number, height: number): ParticleField {
    const cfg = this.config();
    const count = cfg.skills.length;
    const positions = new Float32Array(count * 3);
    const ambientVelocities = new Float32Array(count * 2);
    const pushVelocities = new Float32Array(count * 2);
    const radius = this.particleRadius;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iv = i * 2;

      positions[ix] = radius + Math.random() * Math.max(0, width - radius * 2);
      positions[ix + 1] = radius + Math.random() * Math.max(0, height - radius * 2);
      positions[ix + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.baseSpeed * (0.5 + Math.random() * 0.5);
      ambientVelocities[iv] = Math.cos(angle) * speed;
      ambientVelocities[iv + 1] = Math.sin(angle) * speed;
    }

    return { positions, ambientVelocities, pushVelocities, count };
  }

  private buildLines(): void {
    const field = this.field;
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

    // WebGL clamps gl.lineWidth to 1px on virtually every modern browser/GPU combination;
    // this still wires config().lineWidth through so the knob isn't silently dead where it is honored.
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
    if (!this.field) return;

    this.resolveAndCacheColors();
    this.rebuildLineSegments();
    this.renderFrameOnce();
  }

  private rescaleParticlesToBounds(previousWidth: number, previousHeight: number, width: number, height: number): void {
    const field = this.field;
    if (!field) return;

    const scaleX = previousWidth > 0 ? width / previousWidth : 1;
    const scaleY = previousHeight > 0 ? height / previousHeight : 1;
    const { positions, count } = field;
    const radius = this.particleRadius;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = at(positions, ix) * scaleX;
      const y = at(positions, ix + 1) * scaleY;
      positions[ix] = Math.min(Math.max(x, radius), Math.max(radius, width - radius));
      positions[ix + 1] = Math.min(Math.max(y, radius), Math.max(radius, height - radius));
    }
  }

  private applySeparation(field: ParticleField): void {
    const { positions, pushVelocities, count } = field;
    const minDistance = this.particleRadius * 2 + SEPARATION_PADDING_PX;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iv = i * 2;
      const frozenI = this.isFrozen(i);

      for (let j = i + 1; j < count; j++) {
        const jx = j * 3;
        const jv = j * 2;
        const dx = at(positions, ix) - at(positions, jx);
        const dy = at(positions, ix + 1) - at(positions, jx + 1);
        const distance = Math.hypot(dx, dy);

        if (distance <= 0 || distance >= minDistance) continue;

        const strength = ((minDistance - distance) / minDistance) * SEPARATION_STRENGTH;
        const ux = dx / distance;
        const uy = dy / distance;

        if (!frozenI) {
          pushVelocities[iv] = at(pushVelocities, iv) + ux * strength;
          pushVelocities[iv + 1] = at(pushVelocities, iv + 1) + uy * strength;
        }
        if (!this.isFrozen(j)) {
          pushVelocities[jv] = at(pushVelocities, jv) - ux * strength;
          pushVelocities[jv + 1] = at(pushVelocities, jv + 1) - uy * strength;
        }
      }
    }
  }

  private applyExclusionZone(field: ParticleField, zone: ExclusionZone | null): void {
    if (!zone || zone.width <= 0 || zone.height <= 0 || zone.margin <= 0) return;

    const { positions, pushVelocities, count } = field;

    for (let i = 0; i < count; i++) {
      if (this.isFrozen(i)) continue;

      const ix = i * 3;
      const iv = i * 2;
      const x = at(positions, ix);
      const y = at(positions, ix + 1);

      const nearestX = Math.min(Math.max(x, zone.x), zone.x + zone.width);
      const nearestY = Math.min(Math.max(y, zone.y), zone.y + zone.height);
      let dx = x - nearestX;
      let dy = y - nearestY;
      const distance = Math.hypot(dx, dy);

      if (distance >= zone.margin) continue;

      if (distance === 0) {
        const centerX = zone.x + zone.width / 2;
        const centerY = zone.y + zone.height / 2;
        dx = x - centerX || 1;
        dy = y - centerY;
      }

      const length = Math.hypot(dx, dy) || 1;
      const strength = (1 - distance / zone.margin) * zone.force;

      pushVelocities[iv] = at(pushVelocities, iv) + (dx / length) * strength;
      pushVelocities[iv + 1] = at(pushVelocities, iv + 1) + (dy / length) * strength;
    }
  }

  private applyEdgeRepulsion(field: ParticleField): void {
    const { positions, pushVelocities, count } = field;
    const radius = this.particleRadius;
    const width = this.width;
    const height = this.height;

    for (let i = 0; i < count; i++) {
      if (this.isFrozen(i)) continue;

      const ix = i * 3;
      const iv = i * 2;
      const x = at(positions, ix);
      const y = at(positions, ix + 1);

      const distLeft = x - radius;
      const distRight = width - radius - x;
      const distTop = y - radius;
      const distBottom = height - radius - y;

      if (distLeft < EDGE_REPULSION_MARGIN_PX) {
        pushVelocities[iv] =
          at(pushVelocities, iv) +
          ((EDGE_REPULSION_MARGIN_PX - distLeft) / EDGE_REPULSION_MARGIN_PX) * EDGE_REPULSION_FORCE;
      }
      if (distRight < EDGE_REPULSION_MARGIN_PX) {
        pushVelocities[iv] =
          at(pushVelocities, iv) -
          ((EDGE_REPULSION_MARGIN_PX - distRight) / EDGE_REPULSION_MARGIN_PX) * EDGE_REPULSION_FORCE;
      }
      if (distTop < EDGE_REPULSION_MARGIN_PX) {
        pushVelocities[iv + 1] =
          at(pushVelocities, iv + 1) +
          ((EDGE_REPULSION_MARGIN_PX - distTop) / EDGE_REPULSION_MARGIN_PX) * EDGE_REPULSION_FORCE;
      }
      if (distBottom < EDGE_REPULSION_MARGIN_PX) {
        pushVelocities[iv + 1] =
          at(pushVelocities, iv + 1) -
          ((EDGE_REPULSION_MARGIN_PX - distBottom) / EDGE_REPULSION_MARGIN_PX) * EDGE_REPULSION_FORCE;
      }
    }
  }

  private applyAmbientJitter(field: ParticleField, baseSpeed: number): void {
    const { ambientVelocities, count } = field;
    const floor = baseSpeed * AMBIENT_SPEED_FLOOR_RATIO;
    const ceiling = baseSpeed * AMBIENT_SPEED_CEILING_RATIO;

    for (let i = 0; i < count; i++) {
      if (this.isFrozen(i)) continue;

      const iv = i * 2;

      const jitteredX = at(ambientVelocities, iv) + (Math.random() - 0.5) * AMBIENT_JITTER_PER_FRAME;
      const jitteredY = at(ambientVelocities, iv + 1) + (Math.random() - 0.5) * AMBIENT_JITTER_PER_FRAME;
      const speed = Math.hypot(jitteredX, jitteredY);

      if (speed <= 0) continue;

      const clampedSpeed = Math.min(Math.max(speed, floor), ceiling);
      const scale = clampedSpeed / speed;
      ambientVelocities[iv] = jitteredX * scale;
      ambientVelocities[iv + 1] = jitteredY * scale;
    }
  }

  private integrate(): void {
    const field = this.field;
    if (!field) return;

    const cfg = this.config();
    this.applyAmbientJitter(field, cfg.baseSpeed);
    this.applySeparation(field);
    this.applyExclusionZone(field, cfg.textExclusionZone);
    this.applyExclusionZone(field, cfg.navExclusionZone);
    this.applyEdgeRepulsion(field);

    const { positions, ambientVelocities, pushVelocities, count } = field;
    const width = this.width;
    const height = this.height;
    const radius = this.particleRadius;
    const mouseActive = cfg.mouse.enabled && this.pointerX !== null && this.pointerY !== null;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iv = i * 2;

      const dampedPushX = at(pushVelocities, iv) * cfg.damping;
      const dampedPushY = at(pushVelocities, iv + 1) * cfg.damping;
      pushVelocities[iv] = dampedPushX;
      pushVelocities[iv + 1] = dampedPushY;

      if (this.isFrozen(i)) continue;

      if (mouseActive) {
        const dx = at(positions, ix) - (this.pointerX as number);
        const dy = at(positions, ix + 1) - (this.pointerY as number);
        const distance = Math.hypot(dx, dy);

        if (distance > radius && distance < cfg.mouse.radius) {
          const strength = (1 - distance / cfg.mouse.radius) * cfg.mouse.force;
          pushVelocities[iv] = at(pushVelocities, iv) + (dx / distance) * strength;
          pushVelocities[iv + 1] = at(pushVelocities, iv + 1) + (dy / distance) * strength;
        }
      }

      const ambientVX = at(ambientVelocities, iv);
      const ambientVY = at(ambientVelocities, iv + 1);
      let vx = ambientVX + at(pushVelocities, iv);
      let vy = ambientVY + at(pushVelocities, iv + 1);
      const speed = Math.hypot(vx, vy);

      if (speed > cfg.maxSpeed) {
        const scale = cfg.maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        pushVelocities[iv] = vx - ambientVX;
        pushVelocities[iv + 1] = vy - ambientVY;
      }

      let x = at(positions, ix) + vx;
      let y = at(positions, ix + 1) + vy;

      if (x < radius) {
        x = radius;
        ambientVelocities[iv] = Math.abs(ambientVX);
        pushVelocities[iv] = Math.abs(at(pushVelocities, iv));
      } else if (x > width - radius) {
        x = width - radius;
        ambientVelocities[iv] = -Math.abs(ambientVX);
        pushVelocities[iv] = -Math.abs(at(pushVelocities, iv));
      }

      if (y < radius) {
        y = radius;
        ambientVelocities[iv + 1] = Math.abs(ambientVY);
        pushVelocities[iv + 1] = Math.abs(at(pushVelocities, iv + 1));
      } else if (y > height - radius) {
        y = height - radius;
        ambientVelocities[iv + 1] = -Math.abs(ambientVY);
        pushVelocities[iv + 1] = -Math.abs(at(pushVelocities, iv + 1));
      }

      positions[ix] = x;
      positions[ix + 1] = y;
    }
  }

  private rebuildLineSegments(): void {
    const field = this.field;
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
    const field = this.field;
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
        this.integrate();
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
    this.field = null;
  }
}
