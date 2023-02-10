import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CqrsComponent } from './cqrs/cqrs.component';
import { CrudGeneratorComponent } from './crud-generator/crud-generator.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { HotReloadComponent } from './hot-reload/hot-reload.component';
import { MikroOrmComponent } from './mikroorm/mikroorm.component';
import { MongodbComponent } from './mongodb/mongodb.component';
import { PrismaComponent } from './prisma/prisma.component';
import { ReplComponent } from './repl/repl.component';
import { ServeStaticComponent } from './serve-static/serve-static.component';
import { SqlSequelizeComponent } from './sql-sequelize/sql-sequelize.component';
import { SqlTypeormComponent } from './sql-typeorm/sql-typeorm.component';
import { TerminusComponent } from './terminus/terminus.component';
import { RouterModuleComponent } from './router-module/router-module.component';
import { NestCommanderComponent } from './nest-commander/nest-commander.component';
import { AsyncLocalStorageComponent } from './async-local-storage/async-local-storage.component';
import { AutomockComponent } from './automock/automock.component';
import { NestiaComponent } from './nestia/nestia.component';

const routes: Routes = [
  {
    path: 'mikroorm',
    component: MikroOrmComponent,
    data: { title: 'MikroORM' },
  },
  {
    path: 'sql-typeorm',
    component: SqlTypeormComponent,
    data: { title: 'SQL (TypeORM)' },
  },
  {
    path: 'mongodb',
    component: MongodbComponent,
    data: { title: 'MongoDB (Mongoose)' },
  },
  {
    path: 'sql-sequelize',
    component: SqlSequelizeComponent,
    data: { title: 'SQL (Sequelize)' },
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
    path: 'documentation',
    component: DocumentationComponent,
    data: { title: 'Documentation (Compodoc)' },
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
    path: 'automock',
    component: AutomockComponent,
    data: { title: 'Automock' },
  },
  {
    path: 'nestia',
    component: NestiaComponent,
    data: { title: "Nestia" }
  },
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    MikroOrmComponent,
    SqlTypeormComponent,
    SqlSequelizeComponent,
    MongodbComponent,
    PrismaComponent,
    CqrsComponent,
    HotReloadComponent,
    TerminusComponent,
    DocumentationComponent,
    CrudGeneratorComponent,
    RouterModuleComponent,
    ServeStaticComponent,
    NestCommanderComponent,
    AsyncLocalStorageComponent,
    AutomockComponent,
    ReplComponent,
  ],
})
export class RecipesModule {}
