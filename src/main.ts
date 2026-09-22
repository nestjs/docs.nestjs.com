import { ViewportScroller } from '@angular/common';
import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { environment } from './environments/environment';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { RoutingModule } from './app/app.routes';
import { DocsViewportScroller } from './app/shared/services/docs-viewport-scroller';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    importProvidersFrom(BrowserModule, RoutingModule),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideAnimations(),
    { provide: ViewportScroller, useClass: DocsViewportScroller },
  ],
});
