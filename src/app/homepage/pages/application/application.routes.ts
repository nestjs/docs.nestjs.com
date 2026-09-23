import { Routes } from '@angular/router';
import { movedTo } from '../../../shared/utils/moved-page-redirect';
import { ConfigurationComponent } from './configuration/configuration.component';
import { EventsComponent } from './events/events.component';
import { HttpClientComponent } from './http-client/http-client.component';
import { LoggerComponent } from './logger/logger.component';
import { QueuesComponent } from './queues/queues.component';
import { SerializationComponent } from './serialization/serialization.component';
import { TaskSchedulingComponent } from './task-scheduling/task-scheduling.component';
import { ValidationComponent } from './validation/validation.component';

export const APPLICATION_ROUTES: Routes = [
  {
    path: 'configuration',
    component: ConfigurationComponent,
    data: { title: 'Configuration' },
  },
  {
    path: 'validation',
    component: ValidationComponent,
    data: { title: 'Validation' },
  },
  {
    path: 'serialization',
    component: SerializationComponent,
    data: { title: 'Serialization' },
  },
  {
    path: 'logger',
    component: LoggerComponent,
    data: { title: 'Logger' },
  },
  {
    path: 'events',
    component: EventsComponent,
    data: { title: 'Events' },
  },
  {
    path: 'task-scheduling',
    component: TaskSchedulingComponent,
    data: { title: 'Task Scheduling' },
  },
  {
    path: 'queues',
    component: QueuesComponent,
    data: { title: 'Queues' },
  },
  {
    path: 'http-client',
    component: HttpClientComponent,
    data: { title: 'HTTP client' },
  },
  // The Axios-based HTTP module chapter, replaced by the HTTP client.
  { path: 'http-module', redirectTo: movedTo('/application/http-client') },
];
