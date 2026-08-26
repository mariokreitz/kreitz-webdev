import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { PublicProject } from '../public-project.model';
import { ProjectCard } from './project-card/project-card.component';

@Component({
  selector: 'kwd-frontend-projects-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCard],
  templateUrl: './projects-section.component.html',
})
export class ProjectsSection {
  public readonly projects = input.required<readonly PublicProject[]>();
}
