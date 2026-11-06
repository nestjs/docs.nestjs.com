import { ViewportScroller } from '@angular/common';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RoutingModule } from './app.routes';
import { DocsViewportScroller } from './shared/services/docs-viewport-scroller';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(BrowserModule, RoutingModule),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideAnimations(),
    { provide: ViewportScroller, useClass: DocsViewportScroller },
  ],
};
