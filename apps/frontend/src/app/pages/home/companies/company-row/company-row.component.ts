import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';

import type { PublicCompany } from '../../public-company.model';

function formatYear(isoDate: string): string {
  return new Date(isoDate).getUTCFullYear().toString();
}

@Component({
  selector: 'kwd-frontend-company-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [NgOptimizedImage],
  templateUrl: './company-row.component.html',
})
export class CompanyRow {
  public readonly company = input.required<PublicCompany>();

  protected readonly dateRange: Signal<string | null> = computed(() => {
    const { startDate, endDate } = this.company();

    if (!startDate) {
      return null;
    }

    const start = formatYear(startDate);
    const end = endDate ? formatYear(endDate) : 'Present';

    return start === end ? start : `${start} – ${end}`;
  });
}
