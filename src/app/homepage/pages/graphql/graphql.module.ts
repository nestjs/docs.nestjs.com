import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { GuardsInterceptorsComponent } from './guards-interceptors/guards-interceptors.component';
import { MutationsComponent } from './mutations/mutations.component';
import { QuickStartComponent } from './quick-start/quick-start.component';
import { ResolversMapComponent } from './resolvers-map/resolvers-map.component';
import { ScalarsComponent } from './scalars/scalars.component';
import { SchemaStitchingComponent } from './schema-stitching/schema-stitching.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';

const routes: Routes = [
  {
    path: 'quick-start',
    component: QuickStartComponent,
    data: { title: 'GraphQL + TypeScript' },
  },
  {
    path: 'resolvers-map',
    component: ResolversMapComponent,
    data: { title: 'GraphQL + TypeScript - Resolvers Map' },
  },
  {
    path: 'mutations',
    component: MutationsComponent,
    data: { title: 'GraphQL + TypeScript - Mutations' },
  },
  {
    path: 'scalars',
    component: ScalarsComponent,
    data: { title: 'GraphQL + TypeScript - Scalars' },
  },
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
    data: { title: 'GraphQL + TypeScript - Subscriptions' },
  },
  {
    path: 'guards-interceptors',
    redirectTo: 'tooling',
  },
  {
    path: 'tooling',
    component: GuardsInterceptorsComponent,
    data: { title: 'GraphQL + TypeScript - Other features' },
  },
  {
    path: 'schema-stitching',
    component: SchemaStitchingComponent,
    data: { title: 'GraphQL - Schema Stitching' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    QuickStartComponent,
    ResolversMapComponent,
    MutationsComponent,
    SubscriptionsComponent,
    SchemaStitchingComponent,
    GuardsInterceptorsComponent,
    ScalarsComponent,
  ],
})
export class GraphqlModule {}
