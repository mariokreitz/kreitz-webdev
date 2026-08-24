import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@shared/environments';
import { ConfirmDialog, Skeleton } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { ApiEnvelope, CreatedWebsiteToken, WebsiteTokenSummary } from '../../../../core/api';
import { ToastService } from '../../../../core/toast';
import { WebsiteTokenService, type CreateWebsiteTokenPayload } from '../../../../core/websites';
import { CreateTokenForm, type CreateTokenFormValue } from './create-token-form/create-token-form.component';
import { TokenRevealDialog } from './token-reveal-dialog/token-reveal-dialog.component';

@Component({
  selector: 'kwd-portal-tokens-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Skeleton, FontAwesomeModule, TranslatePipe, ConfirmDialog, CreateTokenForm, TokenRevealDialog],
  templateUrl: './tokens-section.component.html',
})
export class TokensSection {
  public readonly websiteId = input.required<string>();

  private readonly tokenService: WebsiteTokenService = inject(WebsiteTokenService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly addIcon = faPlus;
  protected readonly deleteIcon = faTrash;

  protected readonly tokensResource = httpResource<readonly WebsiteTokenSummary[]>(
    () => ({ url: `${environment.api.kreitzWebdev}/websites/${this.websiteId()}/tokens`, withCredentials: true }),
    { parse: (raw) => (raw as ApiEnvelope<readonly WebsiteTokenSummary[]>).data, defaultValue: [] },
  );

  public readonly isFormOpen: WritableSignal<boolean> = signal(false);
  public readonly creating: WritableSignal<boolean> = signal(false);
  public readonly deleting: WritableSignal<boolean> = signal(false);

  private readonly revealedTokenSignal: WritableSignal<CreatedWebsiteToken | null> = signal(null);
  public readonly revealedToken: Signal<CreatedWebsiteToken | null> = this.revealedTokenSignal.asReadonly();

  private readonly pendingDeleteSignal: WritableSignal<WebsiteTokenSummary | null> = signal(null);
  public readonly pendingDelete: Signal<WebsiteTokenSummary | null> = this.pendingDeleteSignal.asReadonly();

  public onAddRequested(): void {
    this.isFormOpen.set(true);
  }

  public onAddCancelled(): void {
    this.isFormOpen.set(false);
  }

  public async onAddSubmit(value: CreateTokenFormValue): Promise<void> {
    this.creating.set(true);

    try {
      const payload: CreateWebsiteTokenPayload = value.expiresAt
        ? { name: value.name, expiresAt: value.expiresAt }
        : { name: value.name };
      const created = await this.tokenService.create(this.websiteId(), payload);
      this.tokensResource.reload();
      this.isFormOpen.set(false);
      this.revealedTokenSignal.set(created);
    } catch {
      // no-op
    } finally {
      this.creating.set(false);
    }
  }

  public onRevealDialogClosed(): void {
    this.revealedTokenSignal.set(null);
  }

  public onDeleteRequested(token: WebsiteTokenSummary): void {
    this.pendingDeleteSignal.set(token);
  }

  public onDeleteCancelled(): void {
    this.pendingDeleteSignal.set(null);
  }

  public async onDeleteConfirmed(): Promise<void> {
    const token = this.pendingDeleteSignal();

    if (!token) {
      return;
    }

    this.deleting.set(true);

    try {
      await this.tokenService.remove(this.websiteId(), token.id);
      this.tokensResource.reload();
      this.pendingDeleteSignal.set(null);
      this.toastService.show({ severity: 'success', message: this.translate.instant('websites.tokens.toast.deleted') });
    } catch {
      // no-op
    } finally {
      this.deleting.set(false);
    }
  }
}
