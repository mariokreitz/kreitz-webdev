import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavIsland } from './layout/nav-island/nav-island.component';
import { SiteFooter } from './pages/home/footer/site-footer.component';

@Component({
  imports: [RouterOutlet, NavIsland, SiteFooter],
  selector: 'kwd-frontend-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {}
