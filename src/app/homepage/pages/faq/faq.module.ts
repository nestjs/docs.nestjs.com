import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ErrorsComponent } from './errors/errors.component';
import { GlobalPrefixComponent } from './global-prefix/global-prefix.component';
import { HttpAdapterComponent } from './http-adapter/http-adapter.component';
import { HybridApplicationComponent } from './hybrid-application/hybrid-application.component';
import { MultipleServersComponent } from './multiple-servers/multiple-servers.component';
import { RequestLifecycleComponent } from './request-lifecycle/request-lifecycle.component';
import { ServerlessComponent } from './serverless/serverless.component';

const routes: Routes = [
  {
    path: 'global-prefix',
    component: GlobalPrefixComponent,
    data: { title: 'Global prefix - FAQ' },
  },
  {
    path: 'hybrid-application',
    component: HybridApplicationComponent,
    data: { title: 'Hybrid application - FAQ' },
  },
  {
    path: 'multiple-servers',
    component: MultipleServersComponent,
    data: { title: 'HTTPS & Multiple Servers - FAQ' },
  },
  {
    path: 'http-adapter',
    component: HttpAdapterComponent,
    data: { title: 'HTTP adapter - FAQ' },
  },
  {
    path: 'request-lifecycle',
    component: RequestLifecycleComponent,
    data: { title: 'Request lifecycle - FAQ' },
  },
  {
    path: 'common-errors',
    component: ErrorsComponent,
    data: { title: 'Common errors - FAQ' },
  },
  {
    path: 'serverless',
    component: ServerlessComponent,
    data: { title: 'Serverless - FAQ' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    GlobalPrefixComponent,
    HybridApplicationComponent,
    MultipleServersComponent,
    HttpAdapterComponent,
    RequestLifecycleComponent,
    ErrorsComponent,
    ServerlessComponent,
  ],
})
export class FaqModule {}
