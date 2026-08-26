import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type ProjectCardVariant = 'feature' | 'compact';

export type TagIcon =
  | { readonly kind: 'fontawesome'; readonly icon: IconDefinition }
  | { readonly kind: 'brand'; readonly path: string; readonly viewBox: string };

export interface TagChip {
  readonly name: string;
  readonly icon: TagIcon;
}
