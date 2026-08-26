import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, Project } from '../api';

@Injectable({ providedIn: 'root' })
export class GithubImportService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl: string = `${environment.api.kreitzWebdev}/projects/github`;

  public async importRepo(githubId: string, owner: string, repo: string): Promise<Project> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<Project>>(
        `${this.baseUrl}/import`,
        { githubId, owner, repo },
        { withCredentials: true },
      ),
    );

    return envelope.data;
  }

  public async refresh(projectId: string): Promise<Project> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<Project>>(`${this.baseUrl}/${projectId}/refresh`, null, { withCredentials: true }),
    );

    return envelope.data;
  }
}
