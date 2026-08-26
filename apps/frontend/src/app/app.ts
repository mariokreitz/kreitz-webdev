import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavIsland } from './layout/nav-island/nav-island.component';

@Component({
  imports: [RouterOutlet, NavIsland],
  selector: 'kwd-frontend-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {}
