import { Routes } from '@angular/router';
import { CloudflareWorkersComponent } from './cloudflare-workers/cloudflare-workers.component';
import { ErrorsComponent } from './errors/errors.component';
import { GlobalPrefixComponent } from './global-prefix/global-prefix.component';
import { HttpAdapterComponent } from './http-adapter/http-adapter.component';
import { HybridApplicationComponent } from './hybrid-application/hybrid-application.component';
import { KeepAliveConnectionsComponent } from './keep-alive-connections/keep-alive-connections.component';
import { MultipleServersComponent } from './multiple-servers/multiple-servers.component';
import { NestVsFastifyExpressHonoComponent } from './nest-vs-fastify-express-hono/nest-vs-fastify-express-hono.component';
import { RawBodyComponent } from './raw-body/raw-body.component';
import { RequestLifecycleComponent } from './request-lifecycle/request-lifecycle.component';
import { ServerlessComponent } from './serverless/serverless.component';
import { VersionsComponent } from './versions/versions.component';

export const FAQ_ROUTES: Routes = [
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
    path: 'keep-alive-connections',
    component: KeepAliveConnectionsComponent,
    data: { title: 'Keep-Alive connections - FAQ' },
  },
  {
    path: 'raw-body',
    component: RawBodyComponent,
    data: { title: 'Raw Body' },
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
    path: 'nest-vs-fastify-express-hono',
    component: NestVsFastifyExpressHonoComponent,
    data: { title: 'Nest vs Fastify, Express and Hono - FAQ' },
  },
  {
    path: 'cloudflare-workers',
    component: CloudflareWorkersComponent,
    data: { title: 'Cloudflare Workers - FAQ' },
  },
  {
    path: 'serverless',
    component: ServerlessComponent,
    data: { title: 'Serverless - FAQ' },
  },
  {
    path: 'versions',
    component: VersionsComponent,
    data: { title: 'Version compatibility - FAQ' },
  },
];
