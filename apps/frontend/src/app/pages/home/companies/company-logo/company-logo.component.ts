import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';
import { Tooltip } from '@shared/ui';

import type { PublicCompany } from '../../public-company.model';

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0));

  return letters.join('').toUpperCase() || '?';
}

@Component({
  selector: 'kwd-frontend-company-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [NgOptimizedImage, Tooltip],
  templateUrl: './company-logo.component.html',
})
export class CompanyLogo {
  public readonly company = input.required<PublicCompany>();

  protected readonly initials: Signal<string> = computed(() => initialsOf(this.company().name));
}
