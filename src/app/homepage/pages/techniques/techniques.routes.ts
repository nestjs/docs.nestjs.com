import { Routes } from '@angular/router';
import { movedTo, splitInto } from '../../../shared/utils/moved-page-redirect';
import { DATABASE_SECTIONS } from '../data/database-sections';

// The Techniques category was split into Application, Data, and HTTP. These
// redirects keep the old URLs (and links to their sections) working.
export const TECHNIQUES_ROUTES: Routes = [
  { path: 'authentication', redirectTo: movedTo('/security/authentication') },
  { path: 'security', redirectTo: movedTo('/security/helmet') },
  { path: 'hot-reload', redirectTo: movedTo('/recipes/hot-reload') },
  { path: 'caching', redirectTo: movedTo('/data/caching') },
  { path: 'compression', redirectTo: movedTo('/http/compression') },
  { path: 'configuration', redirectTo: movedTo('/application/configuration') },
  { path: 'cookies', redirectTo: movedTo('/http/cookies') },
  {
    path: 'database',
    redirectTo: splitInto('/data/overview', DATABASE_SECTIONS),
  },
  { path: 'events', redirectTo: movedTo('/application/events') },
  { path: 'file-upload', redirectTo: movedTo('/http/file-upload') },
  { path: 'http-module', redirectTo: movedTo('/application/http-client') },
  { path: 'logger', redirectTo: movedTo('/application/logger') },
  { path: 'mongodb', redirectTo: movedTo('/data/mongodb') },
  { path: 'mvc', redirectTo: movedTo('/http/mvc') },
  { path: 'performance', redirectTo: movedTo('/http/performance') },
  { path: 'queues', redirectTo: movedTo('/application/queues') },
  { path: 'serialization', redirectTo: movedTo('/application/serialization') },
  {
    path: 'server-sent-events',
    redirectTo: movedTo('/http/server-sent-events'),
  },
  { path: 'session', redirectTo: movedTo('/http/session') },
  {
    path: 'sql',
    redirectTo: splitInto('/data/overview', DATABASE_SECTIONS),
  },
  {
    path: 'streaming-files',
    redirectTo: movedTo('/http/file-upload', 'streaming-files'),
  },
  {
    path: 'task-scheduling',
    redirectTo: movedTo('/application/task-scheduling'),
  },
  { path: 'validation', redirectTo: movedTo('/application/validation') },
  { path: 'versioning', redirectTo: movedTo('/http/versioning') },
];
