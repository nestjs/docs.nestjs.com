import { Routes } from '@angular/router';
import { McpOverviewComponent } from './overview/overview.component';
import { McpPrimitivesComponent } from './primitives/primitives.component';
import { McpTransportsComponent } from './transports/transports.component';
import { McpTestingComponent } from './testing/testing.component';
import { McpMigrationComponent } from './migration/migration.component';

export const MCP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    component: McpOverviewComponent,
    data: { title: 'MCP - Overview' },
  },
  {
    path: 'primitives',
    component: McpPrimitivesComponent,
    data: { title: 'MCP - Primitives' },
  },
  {
    path: 'transports',
    component: McpTransportsComponent,
    data: { title: 'MCP - Transports' },
  },
  {
    path: 'testing',
    component: McpTestingComponent,
    data: { title: 'MCP - Testing' },
  },
  {
    path: 'migration',
    component: McpMigrationComponent,
    data: { title: 'MCP - Migration' },
  },
];
