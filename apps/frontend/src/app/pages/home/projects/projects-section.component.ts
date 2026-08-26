import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { ProjectCategory, PublicProject } from '../public-project.model';
import { ProjectCard } from './project-card/project-card.component';

const DEMO_CATEGORIES: ReadonlySet<ProjectCategory> = new Set<ProjectCategory>(['DEMO', 'POC', 'MVP']);

function isDemoProject(project: PublicProject): boolean {
  return project.category != null && DEMO_CATEGORIES.has(project.category);
}

@Component({
  selector: 'kwd-frontend-projects-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectCard, TranslatePipe],
  templateUrl: './projects-section.component.html',
})
export class ProjectsSection {
  public readonly projects = input.required<readonly PublicProject[]>();

  public readonly liveProjects: Signal<readonly PublicProject[]> = computed(() =>
    this.projects().filter((project) => !isDemoProject(project)),
  );

  public readonly demoProjects: Signal<readonly PublicProject[]> = computed(() =>
    this.projects().filter(isDemoProject),
  );
}
