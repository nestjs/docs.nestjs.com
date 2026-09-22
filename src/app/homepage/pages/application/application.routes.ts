import { Routes } from '@angular/router';
import { ConfigurationComponent } from './configuration/configuration.component';
import { EventsComponent } from './events/events.component';
import { HttpModuleComponent } from './http-module/http-module.component';
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
    path: 'http-module',
    component: HttpModuleComponent,
    data: { title: 'HTTP module' },
  },
];
