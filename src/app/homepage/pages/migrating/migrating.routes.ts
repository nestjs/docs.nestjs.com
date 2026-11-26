import { Routes } from '@angular/router';
import { ExpressMigrationComponent } from './express/express.component';
import { FastifyMigrationComponent } from './fastify/fastify.component';
import { SpringBootComponent } from './spring-boot/spring-boot.component';
import { AspnetCoreComponent } from './aspnet-core/aspnet-core.component';
import { DjangoComponent } from './django/django.component';
import { FastapiComponent } from './fastapi/fastapi.component';

export const MIGRATING_ROUTES: Routes = [
  {
    path: 'express',
    component: ExpressMigrationComponent,
    data: { title: 'Migrating from Express' },
  },
  {
    path: 'fastify',
    component: FastifyMigrationComponent,
    data: { title: 'Migrating from Fastify' },
  },
  {
    path: 'spring-boot',
    component: SpringBootComponent,
    data: { title: 'Coming from Spring Boot' },
  },
  {
    path: 'aspnet-core',
    component: AspnetCoreComponent,
    data: { title: 'Coming from ASP.NET Core' },
  },
  {
    path: 'django',
    component: DjangoComponent,
    data: { title: 'Coming from Django' },
  },
  {
    path: 'fastapi',
    component: FastapiComponent,
    data: { title: 'Coming from FastAPI' },
  },
];
