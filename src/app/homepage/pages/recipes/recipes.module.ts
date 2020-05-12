import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CqrsComponent } from './cqrs/cqrs.component';
import { CrudComponent } from './crud/crud.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { HotReloadComponent } from './hot-reload/hot-reload.component';
import { MongodbComponent } from './mongodb/mongodb.component';
import { PrismaComponent } from './prisma/prisma.component';
import { ServeStaticComponent } from './serve-static/serve-static.component';
import { SqlSequelizeComponent } from './sql-sequelize/sql-sequelize.component';
import { SqlTypeormComponent } from './sql-typeorm/sql-typeorm.component';
import { SwaggerComponent } from './swagger/swagger.component';
import { TerminusComponent } from './terminus/terminus.component';

const routes: Routes = [
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
    component: SwaggerComponent,
    data: { title: 'OpenAPI (Swagger)' },
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
    redirectTo: '/controllers',
  },
  {
    path: 'crud',
    redirectTo: '/controllers',
  },
  {
    path: 'hot-reload',
    component: HotReloadComponent,
    data: { title: 'Hot reload' },
  },
  {
    path: 'serve-static',
    component: ServeStaticComponent,
    data: { title: 'Serve Static' },
  },
];

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    SqlTypeormComponent,
    SqlSequelizeComponent,
    MongodbComponent,
    SwaggerComponent,
    PrismaComponent,
    CqrsComponent,
    HotReloadComponent,
    TerminusComponent,
    DocumentationComponent,
    CrudComponent,
    ServeStaticComponent,
  ],
})
export class RecipesModule {}
