import {
  inject,
  provideAppInitializer,
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { IMAGE_LOADER } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  RedirectCommand,
  Router,
  withComponentInputBinding,
  withNavigationErrorHandler,
  withViewTransitions,
  type NavigationError,
} from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { appRoutes } from './app.routes';
import { DEFAULT_LANGUAGE, I18N_ASSET_PREFIX } from './core/language/constants';
import { LanguageService } from './core/language';
import { ERROR_ROUTE, type ErrorPageQueryParams } from './core/error';
import { errorInterceptor } from './core/http';
import { avatarImageLoader } from './core/image';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withViewTransitions(),
      withNavigationErrorHandler((error: NavigationError) => {
        const router = inject(Router);
        const queryParams: ErrorPageQueryParams = {
          timestamp: new Date().toISOString(),
          path: error.url,
        };

        return new RedirectCommand(router.createUrlTree([ERROR_ROUTE], { queryParams }));
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    provideTranslateService({
      fallbackLang: DEFAULT_LANGUAGE,
      loader: provideTranslateHttpLoader({
        prefix: I18N_ASSET_PREFIX,
        suffix: '.json',
        enforceLoading: true,
      }),
    }),
    provideAppInitializer(() => inject(LanguageService).initialize()),
    { provide: IMAGE_LOADER, useValue: avatarImageLoader },
  ],
};
