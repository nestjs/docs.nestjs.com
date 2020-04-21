import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdapterComponent } from './adapter/adapter.component';
import { WsExceptionFiltersComponent } from './exception-filters/exception-filters.component';
import { GatewaysComponent } from './gateways/gateways.component';
import { WsGuardsComponent } from './guards/guards.component';
import { WsInterceptorsComponent } from './interceptors/interceptors.component';
import { WsPipesComponent } from './pipes/pipes.component';

const routes: Routes = [
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

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    GatewaysComponent,
    AdapterComponent,
    WsPipesComponent,
    WsInterceptorsComponent,
    WsGuardsComponent,
    WsExceptionFiltersComponent,
  ],
})
export class WebsocketsModule {}
