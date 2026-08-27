import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, SocialLink } from '../api';
import type { CreateSocialLinkPayload, UpdateSocialLinkPayload } from './types/website-payload.types';

@Injectable({ providedIn: 'root' })
export class WebsiteSocialLinkService {
  private readonly http: HttpClient = inject(HttpClient);

  public async create(websiteId: string, payload: CreateSocialLinkPayload): Promise<SocialLink> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<SocialLink>>(this.baseUrl(websiteId), payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async update(websiteId: string, socialLinkId: string, payload: UpdateSocialLinkPayload): Promise<SocialLink> {
    const envelope = await firstValueFrom(
      this.http.patch<ApiEnvelope<SocialLink>>(`${this.baseUrl(websiteId)}/${socialLinkId}`, payload, {
        withCredentials: true,
      }),
    );

    return envelope.data;
  }

  public async remove(websiteId: string, socialLinkId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiEnvelope<null>>(`${this.baseUrl(websiteId)}/${socialLinkId}`, { withCredentials: true }),
    );
  }

  private baseUrl(websiteId: string): string {
    return `${environment.api.kreitzWebdev}/websites/${websiteId}/social-links`;
  }
}
