import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-portal-identity-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './identity-card.component.html',
})
export class IdentityCard {
  public readonly name = input.required<string>();
  public readonly email = input.required<string>();
  public readonly avatarUrl = input<string | null>(null);
  public readonly emailVerified = input.required<boolean>();
  public readonly editDisabled = input(false);

  public readonly editRequested = output();

  public readonly verifiedIcon = faCircleCheck;
  public readonly editIcon = faUserPen;

  public readonly initials: Signal<string> = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  private readonly avatarFailedSignal: WritableSignal<boolean> = signal(false);

  public readonly resolvedAvatarUrl: Signal<string | null> = computed(() => {
    if (this.avatarFailedSignal()) {
      return null;
    }
    return this.avatarUrl();
  });

  public onAvatarError(): void {
    this.avatarFailedSignal.set(true);
  }

  public onEditClick(): void {
    if (this.editDisabled()) {
      return;
    }
    this.editRequested.emit();
  }
}
