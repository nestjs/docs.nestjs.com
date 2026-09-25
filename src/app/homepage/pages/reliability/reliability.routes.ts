import { Routes } from '@angular/router';
import { IdempotencyComponent } from './idempotency/idempotency.component';
import { LocksComponent } from './locks/locks.component';
import { OutboxComponent } from './outbox/outbox.component';
import { ResilienceComponent } from './resilience/resilience.component';

export const RELIABILITY_ROUTES: Routes = [
  {
    path: 'resilience',
    component: ResilienceComponent,
    data: { title: 'Resilience' },
  },
  {
    path: 'idempotency',
    component: IdempotencyComponent,
    data: { title: 'Idempotency keys' },
  },
  {
    path: 'outbox',
    component: OutboxComponent,
    data: { title: 'Transactional outbox' },
  },
  {
    path: 'locks',
    component: LocksComponent,
    data: { title: 'Distributed locks' },
  },
];
