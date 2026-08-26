import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
  type ElementRef,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { ConfirmDialog, Skeleton, Spinner } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, CvStatus } from '../../../core/api';
import { CvService } from '../../../core/cv';
import { ToastService } from '../../../core/toast';
import { formatFileSize } from './utils/format-file-size';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PDF_MIME_TYPE = 'application/pdf';

@Component({
  selector: 'kwd-portal-cv-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Skeleton, FontAwesomeModule, TranslatePipe, Spinner, ConfirmDialog],
  templateUrl: './cv-card.component.html',
})
export class CvCard {
  private readonly cvService: CvService = inject(CvService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly uploadIcon = faUpload;
  protected readonly removeIcon = faTrash;

  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly cvResource = httpResource<CvStatus | null>(
    () => ({ url: `${environment.api.kreitzWebdev}/cv-document/status`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<CvStatus | null>).data, defaultValue: null },
  );

  protected readonly uploading: WritableSignal<boolean> = signal(false);
  protected readonly removing: WritableSignal<boolean> = signal(false);
  protected readonly pendingRemove: WritableSignal<boolean> = signal(false);

  protected formatSize(sizeBytes: number): string {
    return formatFileSize(sizeBytes);
  }

  protected onSelectFileRequested(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected async onFileChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file) {
      return;
    }

    if (file.type !== PDF_MIME_TYPE) {
      this.toastService.show({ severity: 'warning', message: this.translate.instant('profile.cv.errors.invalidType') });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toastService.show({ severity: 'warning', message: this.translate.instant('profile.cv.errors.tooLarge') });
      return;
    }

    this.uploading.set(true);

    try {
      await this.cvService.upload(file);
      this.cvResource.reload();
      this.toastService.show({ severity: 'success', message: this.translate.instant('profile.cv.toast.uploaded') });
    } catch {
      // no-op: the global HTTP error interceptor already surfaces a toast for this failure.
    } finally {
      this.uploading.set(false);
    }
  }

  protected onRemoveRequested(): void {
    this.pendingRemove.set(true);
  }

  protected onRemoveCancelled(): void {
    this.pendingRemove.set(false);
  }

  protected async onRemoveConfirmed(): Promise<void> {
    this.removing.set(true);

    try {
      await this.cvService.remove();
      this.cvResource.reload();
      this.pendingRemove.set(false);
      this.toastService.show({ severity: 'success', message: this.translate.instant('profile.cv.toast.removed') });
    } catch {
      // no-op: the global HTTP error interceptor already surfaces a toast for this failure.
    } finally {
      this.removing.set(false);
    }
  }
}
