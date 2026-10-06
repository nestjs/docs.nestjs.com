import { ViewportScroller } from '@angular/common';
import { enableProdMode, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { environment } from './environments/environment';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { RoutingModule } from './app/app.routes';
import { DocsViewportScroller } from './app/shared/services/docs-viewport-scroller';
import { ParamAwareRouteReuseStrategy } from './app/shared/utils/param-aware-route-reuse-strategy';

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
    { provide: RouteReuseStrategy, useClass: ParamAwareRouteReuseStrategy },
  ],
});
