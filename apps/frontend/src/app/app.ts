import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavIsland } from './layout/nav-island/nav-island.component';
import { SettingsFab } from './layout/settings-fab/settings-fab.component';

@Component({
  imports: [RouterOutlet, NavIsland, SettingsFab],
  selector: 'kwd-frontend-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {}
