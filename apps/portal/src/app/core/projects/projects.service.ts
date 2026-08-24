import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, Project } from '../api';
import type { CreateProjectPayload, UpdateProjectPayload } from './types/project-payload.types';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl: string = `${environment.api.kreitzWebdev}/projects`;

  public async create(payload: CreateProjectPayload): Promise<Project> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<Project>>(this.baseUrl, payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const envelope = await firstValueFrom(
      this.http.patch<ApiEnvelope<Project>>(`${this.baseUrl}/${id}`, payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<ApiEnvelope<null>>(`${this.baseUrl}/${id}`, { withCredentials: true }));
  }
}
