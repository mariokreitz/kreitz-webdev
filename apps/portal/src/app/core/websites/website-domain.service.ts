import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, WebsiteDomain } from '../api';
import type { CreateWebsiteDomainPayload, UpdateWebsiteDomainPayload } from './types/website-payload.types';

@Injectable({ providedIn: 'root' })
export class WebsiteDomainService {
  private readonly http: HttpClient = inject(HttpClient);

  public async create(websiteId: string, payload: CreateWebsiteDomainPayload): Promise<WebsiteDomain> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<WebsiteDomain>>(this.baseUrl(websiteId), payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async update(
    websiteId: string,
    domainId: string,
    payload: UpdateWebsiteDomainPayload,
  ): Promise<WebsiteDomain> {
    const envelope = await firstValueFrom(
      this.http.patch<ApiEnvelope<WebsiteDomain>>(`${this.baseUrl(websiteId)}/${domainId}`, payload, {
        withCredentials: true,
      }),
    );

    return envelope.data;
  }

  public async remove(websiteId: string, domainId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiEnvelope<null>>(`${this.baseUrl(websiteId)}/${domainId}`, { withCredentials: true }),
    );
  }

  private baseUrl(websiteId: string): string {
    return `${environment.api.kreitzWebdev}/websites/${websiteId}/domains`;
  }
}
