import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, CreatedWebsiteToken } from '../api';
import type { CreateWebsiteTokenPayload } from './types/website-payload.types';

@Injectable({ providedIn: 'root' })
export class WebsiteTokenService {
  private readonly http: HttpClient = inject(HttpClient);

  public async create(websiteId: string, payload: CreateWebsiteTokenPayload): Promise<CreatedWebsiteToken> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<CreatedWebsiteToken>>(this.baseUrl(websiteId), payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async remove(websiteId: string, tokenId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl(websiteId)}/${tokenId}`, { withCredentials: true }));
  }

  private baseUrl(websiteId: string): string {
    return `${environment.api.kreitzWebdev}/websites/${websiteId}/tokens`;
  }
}
