import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type SkillIcon =
  | { readonly kind: 'fontawesome'; readonly icon: IconDefinition }
  | { readonly kind: 'brand'; readonly path: string; readonly viewBox: string };

export interface Skill {
  readonly name: string;
  readonly icon: SkillIcon;
  readonly accentVariable: string;
}

export interface ExclusionZone {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly force: number;
  readonly margin: number;
}

export interface ConstellationConfig {
  readonly skills: readonly Skill[];
  readonly linkDistance: number;
  readonly lineOpacity: number;
  readonly lineWidth: number;
  readonly baseSpeed: number;
  readonly maxSpeed: number;
  readonly damping: number;
  readonly mouse: {
    readonly enabled: boolean;
    readonly radius: number;
    readonly force: number;
  };
  readonly textExclusionZone: ExclusionZone | null;
  readonly navExclusionZone: ExclusionZone | null;
}
