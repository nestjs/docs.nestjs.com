import { Routes } from '@angular/router';
import { CompressionComponent } from './compression/compression.component';
import { CookiesComponent } from './cookies/cookies.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { MvcComponent } from './mvc/mvc.component';
import { PerformanceComponent } from './performance/performance.component';
import { ServerSentEventsComponent } from './server-sent-events/server-sent-events.component';
import { SessionComponent } from './sessions/sessions.component';
import { VersioningComponent } from './versioning/versioning.component';

export const HTTP_ROUTES: Routes = [
  {
    path: 'versioning',
    component: VersioningComponent,
    data: { title: 'Versioning' },
  },
  {
    path: 'cookies',
    component: CookiesComponent,
    data: { title: 'Cookies' },
  },
  {
    path: 'session',
    component: SessionComponent,
    data: { title: 'Session' },
  },
  {
    path: 'file-upload',
    component: FileUploadComponent,
    data: { title: 'File upload and streaming' },
  },
  {
    path: 'compression',
    component: CompressionComponent,
    data: { title: 'Compression' },
  },
  {
    path: 'server-sent-events',
    component: ServerSentEventsComponent,
    data: { title: 'Server-Sent Events' },
  },
  {
    path: 'mvc',
    component: MvcComponent,
    data: { title: 'MVC' },
  },
  {
    path: 'performance',
    component: PerformanceComponent,
    data: { title: 'Performance (Fastify)' },
  },
];
