import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@shared/environments';
import { firstValueFrom } from 'rxjs';
import type { ApiEnvelope, CvStatus } from '../api';

@Injectable({ providedIn: 'root' })
export class CvService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly baseUrl: string = `${environment.api.kreitzWebdev}/cv-document`;

  public async upload(file: File): Promise<CvStatus> {
    const formData = new FormData();
    formData.append('file', file);

    const envelope = await firstValueFrom(
      this.http.post<ApiEnvelope<CvStatus>>(this.baseUrl, formData, { withCredentials: true }),
    );

    return envelope.data;
  }

  public async remove(): Promise<void> {
    await firstValueFrom(this.http.delete<ApiEnvelope<null>>(this.baseUrl, { withCredentials: true }));
  }
}
