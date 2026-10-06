import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../../shared/components/api/api.service';
import { ApiDocComponent } from './api-doc/api-doc.component';
import { ApiComponent } from './api.component';

/** The generated page for the route, or `null` when there is none. */
const apiDocResolver: ResolveFn<string | null> = (_route, state) =>
  inject(ApiService)
    .getDocument(state.url.split(/[?#]/)[0])
    .pipe(catchError(() => of(null)));

/**
 * Loads the package list before the overview activates, so its group headings
 * are rendered by the time the shell builds the table of contents.
 */
const apiListResolver: ResolveFn<unknown> = () =>
  inject(ApiService)
    .getApiList()
    .pipe(catchError(() => of(null)));

const apiTitleResolver: ResolveFn<string> = (route) =>
  route.params['symbol'] ?? `@nestjs/${route.params['package']}`;

const apiDocRoute = {
  component: ApiDocComponent,
  resolve: { content: apiDocResolver, title: apiTitleResolver },
  // Every export is its own page: render it afresh instead of reusing the
  // previous one (see ParamAwareRouteReuseStrategy).
  data: { reuseOnParamChange: false },
};

export const API_ROUTES: Routes = [
  {
    path: '',
    component: ApiComponent,
    resolve: { apiList: apiListResolver },
    data: { title: 'API reference' },
  },
  { path: ':package', ...apiDocRoute },
  { path: ':package/:symbol', ...apiDocRoute },
];
