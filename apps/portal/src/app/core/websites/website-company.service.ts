import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, Company } from '../api';
import type { CreateCompanyPayload, UpdateCompanyPayload } from './types/website-payload.types';

@Injectable({ providedIn: 'root' })
export class WebsiteCompanyService {
  private readonly http: HttpClient = inject(HttpClient);

  public async create(websiteId: string, payload: CreateCompanyPayload): Promise<Company> {
    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<Company>>(this.baseUrl(websiteId), payload, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async update(websiteId: string, companyId: string, payload: UpdateCompanyPayload): Promise<Company> {
    const envelope = await firstValueFrom(
      this.http.patch<ApiEnvelope<Company>>(`${this.baseUrl(websiteId)}/${companyId}`, payload, {
        withCredentials: true,
      }),
    );

    return envelope.data;
  }

  public async remove(websiteId: string, companyId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiEnvelope<null>>(`${this.baseUrl(websiteId)}/${companyId}`, { withCredentials: true }),
    );
  }

  private baseUrl(websiteId: string): string {
    return `${environment.api.kreitzWebdev}/websites/${websiteId}/companies`;
  }
}
