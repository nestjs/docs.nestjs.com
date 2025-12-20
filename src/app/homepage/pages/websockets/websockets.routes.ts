import { Routes } from '@angular/router';
import { AdapterComponent } from './adapter/adapter.component';
import { WsExceptionFiltersComponent } from './exception-filters/exception-filters.component';
import { GatewaysComponent } from './gateways/gateways.component';
import { WsGuardsComponent } from './guards/guards.component';
import { WsInterceptorsComponent } from './interceptors/interceptors.component';
import { WsPipesComponent } from './pipes/pipes.component';

export const WEBSOCKETS_ROUTES: Routes = [
  {
    path: 'gateways',
    component: GatewaysComponent,
    data: { title: 'Gateways' },
  },
  {
    path: 'pipes',
    component: WsPipesComponent,
    data: { title: 'Pipes - Gateways' },
  },
  {
    path: 'exception-filters',
    component: WsExceptionFiltersComponent,
    data: { title: 'Exception Filters - Gateways' },
  },
  {
    path: 'guards',
    component: WsGuardsComponent,
    data: { title: 'Guards - Gateways' },
  },
  {
    path: 'interceptors',
    component: WsInterceptorsComponent,
    data: { title: 'Interceptors - Gateways' },
  },
  {
    path: 'adapter',
    component: AdapterComponent,
    data: { title: 'Adapter - Gateways' },
  },
];
