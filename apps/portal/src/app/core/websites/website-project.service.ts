import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, WebsiteProjectLink } from '../api';
import type { CreateWebsiteProjectLinkPayload, UpdateWebsiteProjectLinkPayload } from './types/website-payload.types';

@Injectable({ providedIn: 'root' })
export class WebsiteProjectService {
  private readonly http: HttpClient = inject(HttpClient);

  public async create(websiteId: string, payload: CreateWebsiteProjectLinkPayload): Promise<WebsiteProjectLink> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<WebsiteProjectLink>>(this.baseUrl(websiteId), payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async update(
    websiteId: string,
    projectId: string,
    payload: UpdateWebsiteProjectLinkPayload,
  ): Promise<WebsiteProjectLink> {
    const envelope = await firstValueFrom(
      this.http.patch<ApiEnvelope<WebsiteProjectLink>>(`${this.baseUrl(websiteId)}/${projectId}`, payload, {
        withCredentials: true,
      }),
    );

    return envelope.data;
  }

  public async remove(websiteId: string, projectId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl(websiteId)}/${projectId}`, { withCredentials: true }));
  }

  private baseUrl(websiteId: string): string {
    return `${environment.api.kreitzWebdev}/websites/${websiteId}/projects`;
  }
}
