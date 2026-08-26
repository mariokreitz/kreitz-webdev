import { ChangeDetectionStrategy, Component, computed, input, output, type Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faStar, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import type { Project } from '../../../core/api';

@Component({
  selector: 'kwd-portal-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FontAwesomeModule, TranslatePipe],
  templateUrl: './project-card.component.html',
})
export class ProjectCard {
  public readonly project = input.required<Project>();

  public readonly deleteRequested = output<string>();

  public readonly githubIcon = faGithub;
  public readonly liveIcon = faArrowUpRightFromSquare;
  public readonly deleteIcon = faTrash;
  public readonly starIcon = faStar;

  public readonly isGithubImported: Signal<boolean> = computed(() => this.project().githubId !== null);

  public readonly importedAtLabel: Signal<string> = computed(() =>
    new Date(this.project().importedAt).toLocaleDateString(),
  );

  public onDeleteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.deleteRequested.emit(this.project().id);
  }
}
