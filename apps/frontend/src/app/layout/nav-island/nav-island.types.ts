export type SectionId = 'projects' | 'contact';

export interface SectionTarget {
  readonly id: SectionId;
  readonly element: HTMLElement;
}
