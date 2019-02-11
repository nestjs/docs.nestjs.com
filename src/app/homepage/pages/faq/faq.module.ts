import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { ExpressInstanceComponent } from './express-instance/express-instance.component';
import { GlobalPrefixComponent } from './global-prefix/global-prefix.component';
import { HybridApplicationComponent } from './hybrid-application/hybrid-application.component';
import { LifecycleEventsComponent } from './lifecycle-events/lifecycle-events.component';
import { MultipleServersComponent } from './multiple-servers/multiple-servers.component';

const routes: Routes = [
  {
    path: 'express-instance',
    component: ExpressInstanceComponent,
    data: { title: 'Express instance - FAQ' },
  },
  {
    path: 'global-prefix',
    component: GlobalPrefixComponent,
    data: { title: 'Global prefix - FAQ' },
  },
  {
    path: 'lifecycle-events',
    component: LifecycleEventsComponent,
    data: { title: 'Lifecycle events - FAQ' },
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
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    ExpressInstanceComponent,
    GlobalPrefixComponent,
    LifecycleEventsComponent,
    HybridApplicationComponent,
    MultipleServersComponent,
  ],
})
export class FaqModule {}
