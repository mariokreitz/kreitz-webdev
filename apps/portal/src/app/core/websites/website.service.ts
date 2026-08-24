import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, Website } from '../api';
import type { CreateWebsitePayload, UpdateWebsitePayload } from './types/website-payload.types';

@Injectable({ providedIn: 'root' })
export class WebsiteService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl: string = `${environment.api.kreitzWebdev}/websites`;

  public async create(payload: CreateWebsitePayload): Promise<Website> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<Website>>(this.baseUrl, payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async update(id: string, payload: UpdateWebsitePayload): Promise<Website> {
    const envelope = await firstValueFrom(
      this.http.patch<ApiEnvelope<Website>>(`${this.baseUrl}/${id}`, payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async remove(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<ApiEnvelope<null>>(`${this.baseUrl}/${id}`, { withCredentials: true }));
  }
}
