import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import type { ApiEnvelope } from '../../api';
import { LOGIN_ROUTE } from '../../auth';
import { ToastService } from '../../toast';
import { CurrentUserStore } from '../../user';
import { GENERIC_HTTP_ERROR_MESSAGE, UNAUTHORIZED_STATUS } from '../constants';
import type { ParsedHttpError } from '../types/http-error.types';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const router = inject(Router);
  const currentUserStore = inject(CurrentUserStore);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        throw err;
      }

      const parsedError = parseHttpError(err);

      if (parsedError.statusCode === UNAUTHORIZED_STATUS) {
        currentUserStore.clear();

        if (isPlatformBrowser(platformId)) {
          void router.navigateByUrl(LOGIN_ROUTE);
        }

        return throwError(() => parsedError);
      }

      if (isPlatformBrowser(platformId)) {
        toastService.show({
          severity: parsedError.statusCode >= 500 || parsedError.isNetworkError ? 'error' : 'warning',
          message: parsedError.message,
        });
      }

      return throwError(() => parsedError);
    }),
  );
};

function parseHttpError(err: HttpErrorResponse): ParsedHttpError {
  if (err.status === 0) {
    return { statusCode: 0, message: GENERIC_HTTP_ERROR_MESSAGE, isNetworkError: true };
  }

  const envelope = err.error as ApiEnvelope<null> | null;
  const message = Array.isArray(envelope?.message)
    ? envelope.message.join(' ')
    : (envelope?.message ?? GENERIC_HTTP_ERROR_MESSAGE);

  return { statusCode: err.status, message, isNetworkError: false };
}
