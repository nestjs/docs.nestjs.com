import { Routes } from '@angular/router';
import { CqrsComponent } from './cqrs/cqrs.component';
import { CrudGeneratorComponent } from './crud-generator/crud-generator.component';
import { HotReloadComponent } from './hot-reload/hot-reload.component';
import { MikroOrmComponent } from './mikroorm/mikroorm.component';
import { PrismaComponent } from './prisma/prisma.component';
import { ReplComponent } from './repl/repl.component';
import { ServeStaticComponent } from './serve-static/serve-static.component';
import { TerminusComponent } from './terminus/terminus.component';
import { RouterModuleComponent } from './router-module/router-module.component';
import { NestCommanderComponent } from './nest-commander/nest-commander.component';
import { AsyncLocalStorageComponent } from './async-local-storage/async-local-storage.component';
import { SwcComponent } from './swc/swc.component';
import { PassportComponent } from './passport/passport.component';

export const RECIPES_ROUTES: Routes = [
  {
    path: 'mikroorm',
    component: MikroOrmComponent,
    data: { title: 'MikroORM' },
  },
  {
    path: 'cqrs',
    component: CqrsComponent,
    data: { title: 'CQRS' },
  },
  {
    path: 'swagger',
    redirectTo: '/openapi/introduction',
  },
  {
    path: 'prisma',
    component: PrismaComponent,
    data: { title: 'Prisma' },
  },
  {
    path: 'terminus',
    component: TerminusComponent,
    data: { title: 'Health checks (Terminus)' },
  },
  {
    path: 'crud-utilities',
    redirectTo: '/recipes/crud-generator',
  },
  {
    path: 'crud',
    redirectTo: '/recipes/crud-generator',
  },
  {
    path: 'crud-generator',
    component: CrudGeneratorComponent,
    data: { title: 'CRUD generator' },
  },
  {
    path: 'hot-reload',
    component: HotReloadComponent,
    data: { title: 'Hot reload' },
  },
  {
    path: 'serve-static',
    component: ServeStaticComponent,
    data: { title: 'Serve static' },
  },
  {
    path: 'router-module',
    component: RouterModuleComponent,
    data: { title: 'Router module' },
  },
  {
    path: 'nest-commander',
    component: NestCommanderComponent,
    data: { title: 'Nest Commander' },
  },
  {
    path: 'async-local-storage',
    component: AsyncLocalStorageComponent,
    data: { title: 'Async Local Storage' },
  },
  {
    path: 'repl',
    component: ReplComponent,
    data: { title: 'REPL' },
  },
  {
    path: 'swc',
    component: SwcComponent,
    data: { title: 'SWC (fast compiler)' },
  },
  {
    path: 'passport',
    component: PassportComponent,
    data: { title: 'passport' },
  },
];
