import { isPlatformServer } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  REQUEST_CONTEXT,
  TransferState,
  inject,
  makeStateKey,
  signal,
  type Signal,
  type StateKey,
} from '@angular/core';
import { asHomeRequestContext } from '../ssr';

const CV_AVAILABLE_STATE_KEY: StateKey<boolean> = makeStateKey<boolean>('cv-available');

@Injectable({ providedIn: 'root' })
export class CvAvailabilityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState: TransferState = inject(TransferState);
  private readonly requestContext = asHomeRequestContext(inject(REQUEST_CONTEXT, { optional: true }));

  public readonly available: Signal<boolean> = signal(this.resolveAvailable());

  private resolveAvailable(): boolean {
    if (isPlatformServer(this.platformId)) {
      const cvAvailable = this.requestContext?.cvAvailable ?? false;
      this.transferState.set(CV_AVAILABLE_STATE_KEY, cvAvailable);
      return cvAvailable;
    }

    return this.transferState.get(CV_AVAILABLE_STATE_KEY, false);
  }
}
