import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface NavItemConfig {
  readonly icon: IconDefinition;
  readonly label: string;
  readonly route: string;
}

export interface SidebarUser {
  readonly name: string;
  readonly email: string;
}
