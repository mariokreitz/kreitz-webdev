import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { PublicCompany } from '../public-company.model';
import { CompanyLogo } from './company-logo/company-logo.component';

@Component({
  selector: 'kwd-frontend-companies-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompanyLogo, TranslatePipe],
  templateUrl: './companies-section.component.html',
})
export class CompaniesSection {
  public readonly companies = input.required<readonly PublicCompany[]>();
}
