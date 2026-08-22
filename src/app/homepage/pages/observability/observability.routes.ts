import { Routes } from '@angular/router';
import { ObservabilityOverviewComponent } from './overview/overview.component';
import { ObservabilitySdkComponent } from './sdk/sdk.component';
import { ObservabilityManualInstrumentationComponent } from './manual-instrumentation/manual-instrumentation.component';
import { ObservabilityDistributedTracingComponent } from './distributed-tracing/distributed-tracing.component';
import { ObservabilityDashboardComponent } from './dashboard/dashboard.component';
import { ObservabilityMcpServerComponent } from './mcp-server/mcp-server.component';

export const OBSERVABILITY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    component: ObservabilityOverviewComponent,
    data: { title: 'Observability - Overview' },
  },
  {
    path: 'sdk',
    component: ObservabilitySdkComponent,
    data: { title: 'Observability - SDK' },
  },
  {
    path: 'manual-instrumentation',
    component: ObservabilityManualInstrumentationComponent,
    data: { title: 'Observability - Manual instrumentation' },
  },
  {
    path: 'distributed-tracing',
    component: ObservabilityDistributedTracingComponent,
    data: { title: 'Observability - Distributed tracing' },
  },
  {
    path: 'dashboard',
    component: ObservabilityDashboardComponent,
    data: { title: 'Observability - Dashboard' },
  },
  {
    path: 'mcp-server',
    component: ObservabilityMcpServerComponent,
    data: { title: 'Observability - MCP server' },
  },
];
