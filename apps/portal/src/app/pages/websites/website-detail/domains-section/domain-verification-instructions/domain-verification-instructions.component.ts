import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-portal-domain-verification-instructions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './domain-verification-instructions.component.html',
})
export class DomainVerificationInstructions {
  public readonly domain = input.required<string>();
  public readonly token = input.required<string>();

  protected readonly copyIcon = faCopy;

  protected readonly copied: WritableSignal<boolean> = signal(false);

  protected readonly wellKnownUrl: Signal<string> = computed(
    () => `https://${this.domain()}/.well-known/kreitz-verify.txt`,
  );

  public async onCopyToken(): Promise<void> {
    await navigator.clipboard.writeText(this.token());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
