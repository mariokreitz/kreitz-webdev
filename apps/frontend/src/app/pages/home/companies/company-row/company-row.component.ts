import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { PublicCompany } from '../../public-company.model';

const DOT_BASE_CLASSES = 'relative z-10 size-[11px] shrink-0 rounded-full border-2 bg-(--color-background)';
const DOT_CURRENT_CLASSES = 'border-(--color-secondary) bg-(--color-secondary) ring-4 ring-(--color-secondary)/20';
const DOT_DEFAULT_CLASSES = 'border-(--color-outline-variant)';

const DATE_BASE_CLASSES = 'inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-xs tabular-nums whitespace-nowrap';
const DATE_CURRENT_CLASSES = 'font-semibold text-(--color-secondary)';
const DATE_DEFAULT_CLASSES = 'text-(--color-on-surface-variant)';

function formatYear(isoDate: string): string {
  return new Date(isoDate).getUTCFullYear().toString();
}

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0));

  return letters.join('').toUpperCase() || '?';
}

interface CompanyDateRange {
  readonly start: string;
  readonly end: string | null;
}

@Component({
  selector: 'kwd-frontend-company-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [NgOptimizedImage, TranslatePipe],
  templateUrl: './company-row.component.html',
})
export class CompanyRow {
  public readonly company = input.required<PublicCompany>();

  protected readonly initials: Signal<string> = computed(() => initialsOf(this.company().name));

  protected readonly isCurrent: Signal<boolean> = computed(() => {
    const { startDate, endDate } = this.company();
    return startDate !== null && endDate === null;
  });

  protected readonly dateRange: Signal<CompanyDateRange | null> = computed(() => {
    const { startDate, endDate } = this.company();

    if (!startDate) {
      return null;
    }

    return { start: formatYear(startDate), end: endDate ? formatYear(endDate) : null };
  });

  protected readonly dotClasses: Signal<string> = computed(
    () => `${DOT_BASE_CLASSES} ${this.isCurrent() ? DOT_CURRENT_CLASSES : DOT_DEFAULT_CLASSES}`,
  );

  protected readonly dateClasses: Signal<string> = computed(
    () => `${DATE_BASE_CLASSES} ${this.isCurrent() ? DATE_CURRENT_CLASSES : DATE_DEFAULT_CLASSES}`,
  );
}
