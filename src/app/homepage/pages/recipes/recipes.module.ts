import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { CqrsComponent } from './cqrs/cqrs.component';
import { MongodbComponent } from './mongodb/mongodb.component';
import { PassportComponent } from './passport/passport.component';
import { PrismaComponent } from './prisma/prisma.component';
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
    path: 'passport',
    component: PassportComponent,
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
];

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  declarations: [
    SqlTypeormComponent,
    SqlSequelizeComponent,
    MongodbComponent,
    PassportComponent,
    SwaggerComponent,
    PrismaComponent,
    CqrsComponent,
    TerminusComponent,
  ],
})
export class RecipesModule {}
