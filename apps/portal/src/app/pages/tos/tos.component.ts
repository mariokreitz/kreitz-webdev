import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'kwd-portal-terms-of-service',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tos.component.html',
})
export default class TermsOfService {}
