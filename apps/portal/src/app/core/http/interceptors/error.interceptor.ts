import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import type { ApiEnvelope } from '../../api';
import { LOGIN_ROUTE } from '../../auth';
import { ERROR_ROUTE, type ErrorPageQueryParams } from '../../error';
import { I18N_ASSET_PREFIX } from '../../language/constants';
import { ToastService } from '../../toast';
import { CurrentUserStore } from '../../user';
import { GENERIC_HTTP_ERROR_KEY, REQUEST_ID_HEADER, UNAUTHORIZED_STATUS } from '../constants';
import type { ParsedHttpError } from '../types/http-error.types';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // TranslateService loads its own JSON through this interceptor's HttpClient, so injecting it below while still resolving would be a circular DI error (NG0200).
  if (req.url.startsWith(I18N_ASSET_PREFIX)) {
    return next(req);
  }

  const toastService = inject(ToastService);
  const router = inject(Router);
  const currentUserStore = inject(CurrentUserStore);
  const platformId = inject(PLATFORM_ID);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        throw err;
      }

      const parsedError = parseHttpError(err, translate);

      if (parsedError.statusCode === UNAUTHORIZED_STATUS) {
        currentUserStore.clear();

        if (isPlatformBrowser(platformId)) {
          void router.navigateByUrl(LOGIN_ROUTE);
        }

        return throwError(() => parsedError);
      }

      const isCritical = parsedError.statusCode >= 500 || parsedError.isNetworkError;

      if (isCritical && isPlatformBrowser(platformId)) {
        const requestId = err.headers.get(REQUEST_ID_HEADER);
        const queryParams: ErrorPageQueryParams = {
          ...(requestId ? { requestId } : {}),
          statusCode: String(parsedError.statusCode),
          timestamp: new Date().toISOString(),
        };

        void router.navigate([ERROR_ROUTE], { queryParams });
        return throwError(() => parsedError);
      }

      if (isPlatformBrowser(platformId)) {
        toastService.show({ severity: 'warning', message: parsedError.message });
      }

      return throwError(() => parsedError);
    }),
  );
};

function parseHttpError(err: HttpErrorResponse, translate: TranslateService): ParsedHttpError {
  if (err.status === 0) {
    return { statusCode: 0, message: translate.instant(GENERIC_HTTP_ERROR_KEY), isNetworkError: true };
  }

  const envelope = err.error as ApiEnvelope<null> | null;
  const message = Array.isArray(envelope?.message)
    ? envelope.message.join(' ')
    : (envelope?.message ?? translate.instant(GENERIC_HTTP_ERROR_KEY));

  return { statusCode: err.status, message, isNetworkError: false };
}
