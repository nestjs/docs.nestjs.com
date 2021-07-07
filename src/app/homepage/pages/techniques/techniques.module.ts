import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CachingComponent } from './caching/caching.component';
import { CompressionComponent } from './compression/compression.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { CookiesComponent } from './cookies/cookies.component';
import { EventsComponent } from './events/events.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { HttpModuleComponent } from './http-module/http-module.component';
import { LoggerComponent } from './logger/logger.component';
import { MongoComponent } from './mongo/mongo.component';
import { MvcComponent } from './mvc/mvc.component';
import { PerformanceComponent } from './performance/performance.component';
import { QueuesComponent } from './queues/queues.component';
import { SerializationComponent } from './serialization/serialization.component';
import { ServerSentEventsComponent } from './server-sent-events/server-sent-events.component';
import { SessionComponent } from './sessions/sessions.component';
import { SqlComponent } from './sql/sql.component';
import { StreamingFilesComponent } from './streaming-files/streaming-files.component';
import { TaskSchedulingComponent } from './task-scheduling/task-scheduling.component';
import { ValidationComponent } from './validation/validation.component';
import { VersioningComponent } from './versioning/versioning.component';

const routes: Routes = [
  {
    path: 'authentication',
    redirectTo: '/security/authentication',
  },
  {
    path: 'mvc',
    component: MvcComponent,
    data: { title: 'MVC' },
  },
  {
    path: 'serialization',
    component: SerializationComponent,
    data: { title: 'Serialization' },
  },
  {
    path: 'caching',
    component: CachingComponent,
    data: { title: 'Caching' },
  },
  {
    path: 'validation',
    component: ValidationComponent,
    data: { title: 'Validation' },
  },
  {
    path: 'sql',
    redirectTo: 'database',
  },
  {
    path: 'database',
    component: SqlComponent,
    data: { title: 'Database' },
  },
  {
    path: 'mongodb',
    component: MongoComponent,
    data: { title: 'MongoDB' },
  },
  {
    path: 'file-upload',
    component: FileUploadComponent,
    data: { title: 'File upload' },
  },
  {
    path: 'streaming-files',
    component: StreamingFilesComponent,
    data: { title: 'Streaming Files' },
  },
  {
    path: 'logger',
    component: LoggerComponent,
    data: { title: 'Logger' },
  },
  {
    path: 'performance',
    component: PerformanceComponent,
    data: { title: 'Performance (Fastify)' },
  },
  {
    path: 'http-module',
    component: HttpModuleComponent,
    data: { title: 'HTTP module' },
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
    data: { title: 'Configuration' },
  },
  {
    path: 'security',
    redirectTo: '/security/helmet',
  },
  {
    path: 'cookies',
    component: CookiesComponent,
    data: { title: 'Cookies' },
  },
  {
    path: 'task-scheduling',
    component: TaskSchedulingComponent,
    data: { title: 'Task Scheduling' },
  },
  {
    path: 'compression',
    component: CompressionComponent,
    data: { title: 'Compression' },
  },
  {
    path: 'queues',
    component: QueuesComponent,
    data: { title: 'Queues' },
  },
  {
    path: 'hot-reload',
    redirectTo: '/recipes/hot-reload',
  },
  {
    path: 'server-sent-events',
    component: ServerSentEventsComponent,
    data: { title: 'Server-Sent Events' },
  },
  {
    path: 'versioning',
    component: VersioningComponent,
    data: { title: 'Versioning' },
  },
  {
    path: 'events',
    component: EventsComponent,
    data: { title: 'Events' },
  },
  {
    path: 'session',
    component: SessionComponent,
    data: { title: 'Session' },
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    SqlComponent,
    MvcComponent,
    MongoComponent,
    QueuesComponent,
    LoggerComponent,
    TaskSchedulingComponent,
    PerformanceComponent,
    EventsComponent,
    FileUploadComponent,
    HttpModuleComponent,
    ConfigurationComponent,
    CompressionComponent,
    VersioningComponent,
    ValidationComponent,
    CachingComponent,
    SerializationComponent,
    ServerSentEventsComponent,
    SessionComponent,
    CookiesComponent,
    StreamingFilesComponent,
  ],
})
export class TechniquesModule {}
