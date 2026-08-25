import { ChangeDetectionStrategy, Component, computed, input, type Signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type SkeletonVariant = 'metric' | 'activity';

@Component({
  selector: 'kwd-ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [TranslatePipe],
  templateUrl: './skeleton.component.html',
})
export class Skeleton {
  public readonly variant = input<SkeletonVariant>('metric');
  public readonly rows = input(3);

  protected readonly rowIndexes: Signal<readonly number[]> = computed(() =>
    Array.from({ length: this.rows() }, (_unused, index) => index),
  );
}
