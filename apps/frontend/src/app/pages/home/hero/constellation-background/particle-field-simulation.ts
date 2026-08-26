import type { ConstellationConfig, ExclusionZone } from './constellation-background.types';

export interface ParticleField {
  readonly positions: Float32Array;
  readonly ambientVelocities: Float32Array;
  readonly pushVelocities: Float32Array;
  readonly count: number;
}

export interface ParticleStepParams {
  readonly config: ConstellationConfig;
  readonly width: number;
  readonly height: number;
  readonly particleRadius: number;
  readonly pointerX: number | null;
  readonly pointerY: number | null;
  readonly isFrozen: (index: number) => boolean;
}

const SEPARATION_PADDING_PX = 8;
const SEPARATION_STRENGTH = 0.5;
const AMBIENT_JITTER_PER_FRAME = 0.03;
const AMBIENT_SPEED_FLOOR_RATIO = 0.4;
const AMBIENT_SPEED_CEILING_RATIO = 1.6;
const EDGE_REPULSION_MARGIN_PX = 64;
const EDGE_REPULSION_FORCE = 0.25;

export function at(array: Float32Array, index: number): number {
  return array[index] ?? 0;
}

export class ParticleFieldSimulation {
  public readonly field: ParticleField;

  constructor(count: number, width: number, height: number, particleRadius: number, baseSpeed: number) {
    this.field = ParticleFieldSimulation.buildField(count, width, height, particleRadius, baseSpeed);
  }

  private static buildField(
    count: number,
    width: number,
    height: number,
    radius: number,
    baseSpeed: number,
  ): ParticleField {
    const positions = new Float32Array(count * 3);
    const ambientVelocities = new Float32Array(count * 2);
    const pushVelocities = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iv = i * 2;

      positions[ix] = radius + Math.random() * Math.max(0, width - radius * 2);
      positions[ix + 1] = radius + Math.random() * Math.max(0, height - radius * 2);
      positions[ix + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = baseSpeed * (0.5 + Math.random() * 0.5);
      ambientVelocities[iv] = Math.cos(angle) * speed;
      ambientVelocities[iv + 1] = Math.sin(angle) * speed;
    }

    return { positions, ambientVelocities, pushVelocities, count };
  }

  public rescaleToBounds(
    previousWidth: number,
    previousHeight: number,
    width: number,
    height: number,
    particleRadius: number,
  ): void {
    const scaleX = previousWidth > 0 ? width / previousWidth : 1;
    const scaleY = previousHeight > 0 ? height / previousHeight : 1;
    const { positions, count } = this.field;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = at(positions, ix) * scaleX;
      const y = at(positions, ix + 1) * scaleY;
      positions[ix] = Math.min(Math.max(x, particleRadius), Math.max(particleRadius, width - particleRadius));
      positions[ix + 1] = Math.min(Math.max(y, particleRadius), Math.max(particleRadius, height - particleRadius));
    }
  }

  public step(params: ParticleStepParams): void {
    this.applyAmbientJitter(params.config.baseSpeed, params.isFrozen);
    this.applySeparation(params.particleRadius, params.isFrozen);
    this.applyExclusionZone(params.config.textExclusionZone, params.isFrozen);
    this.applyExclusionZone(params.config.navExclusionZone, params.isFrozen);
    this.applyEdgeRepulsion(params.width, params.height, params.particleRadius, params.isFrozen);
    this.integratePositions(params);
  }

  private applySeparation(particleRadius: number, isFrozen: (index: number) => boolean): void {
    const { positions, pushVelocities, count } = this.field;
    const minDistance = particleRadius * 2 + SEPARATION_PADDING_PX;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iv = i * 2;
      const frozenI = isFrozen(i);

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
        if (!isFrozen(j)) {
          pushVelocities[jv] = at(pushVelocities, jv) - ux * strength;
          pushVelocities[jv + 1] = at(pushVelocities, jv + 1) - uy * strength;
        }
      }
    }
  }

  private applyExclusionZone(zone: ExclusionZone | null, isFrozen: (index: number) => boolean): void {
    if (!zone || zone.width <= 0 || zone.height <= 0 || zone.margin <= 0) return;

    const { positions, pushVelocities, count } = this.field;

    for (let i = 0; i < count; i++) {
      if (isFrozen(i)) continue;

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

  private applyEdgeRepulsion(
    width: number,
    height: number,
    particleRadius: number,
    isFrozen: (index: number) => boolean,
  ): void {
    const { positions, pushVelocities, count } = this.field;

    for (let i = 0; i < count; i++) {
      if (isFrozen(i)) continue;

      const ix = i * 3;
      const iv = i * 2;
      const x = at(positions, ix);
      const y = at(positions, ix + 1);

      const distLeft = x - particleRadius;
      const distRight = width - particleRadius - x;
      const distTop = y - particleRadius;
      const distBottom = height - particleRadius - y;

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

  private applyAmbientJitter(baseSpeed: number, isFrozen: (index: number) => boolean): void {
    const { ambientVelocities, count } = this.field;
    const floor = baseSpeed * AMBIENT_SPEED_FLOOR_RATIO;
    const ceiling = baseSpeed * AMBIENT_SPEED_CEILING_RATIO;

    for (let i = 0; i < count; i++) {
      if (isFrozen(i)) continue;

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

  private integratePositions(params: ParticleStepParams): void {
    const { config, width, height, particleRadius, pointerX, pointerY, isFrozen } = params;
    const { positions, ambientVelocities, pushVelocities, count } = this.field;
    const mouseActive = config.mouse.enabled && pointerX !== null && pointerY !== null;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iv = i * 2;

      const dampedPushX = at(pushVelocities, iv) * config.damping;
      const dampedPushY = at(pushVelocities, iv + 1) * config.damping;
      pushVelocities[iv] = dampedPushX;
      pushVelocities[iv + 1] = dampedPushY;

      if (isFrozen(i)) continue;

      if (mouseActive) {
        const dx = at(positions, ix) - (pointerX as number);
        const dy = at(positions, ix + 1) - (pointerY as number);
        const distance = Math.hypot(dx, dy);

        if (distance > particleRadius && distance < config.mouse.radius) {
          const strength = (1 - distance / config.mouse.radius) * config.mouse.force;
          pushVelocities[iv] = at(pushVelocities, iv) + (dx / distance) * strength;
          pushVelocities[iv + 1] = at(pushVelocities, iv + 1) + (dy / distance) * strength;
        }
      }

      const ambientVX = at(ambientVelocities, iv);
      const ambientVY = at(ambientVelocities, iv + 1);
      let vx = ambientVX + at(pushVelocities, iv);
      let vy = ambientVY + at(pushVelocities, iv + 1);
      const speed = Math.hypot(vx, vy);

      if (speed > config.maxSpeed) {
        const scale = config.maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        pushVelocities[iv] = vx - ambientVX;
        pushVelocities[iv + 1] = vy - ambientVY;
      }

      let x = at(positions, ix) + vx;
      let y = at(positions, ix + 1) + vy;

      if (x < particleRadius) {
        x = particleRadius;
        ambientVelocities[iv] = Math.abs(ambientVX);
        pushVelocities[iv] = Math.abs(at(pushVelocities, iv));
      } else if (x > width - particleRadius) {
        x = width - particleRadius;
        ambientVelocities[iv] = -Math.abs(ambientVX);
        pushVelocities[iv] = -Math.abs(at(pushVelocities, iv));
      }

      if (y < particleRadius) {
        y = particleRadius;
        ambientVelocities[iv + 1] = Math.abs(ambientVY);
        pushVelocities[iv + 1] = Math.abs(at(pushVelocities, iv + 1));
      } else if (y > height - particleRadius) {
        y = height - particleRadius;
        ambientVelocities[iv + 1] = -Math.abs(ambientVY);
        pushVelocities[iv + 1] = -Math.abs(at(pushVelocities, iv + 1));
      }

      positions[ix] = x;
      positions[ix + 1] = y;
    }
  }
}
