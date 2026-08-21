import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'kwd-portal-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
})
export default class Login {}
