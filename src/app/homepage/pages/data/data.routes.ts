import { Routes } from '@angular/router';
import { splitInto } from '../../../shared/utils/moved-page-redirect';
import { DATABASE_SECTIONS } from './database-sections';
import { DrizzleComponent } from './drizzle/drizzle.component';
import { CachingComponent } from './caching/caching.component';
import { MikroOrmComponent } from './mikroorm/mikroorm.component';
import { MongoComponent } from './mongo/mongo.component';
import { DataOverviewComponent } from './overview/overview.component';
import { PrismaComponent } from './prisma/prisma.component';
import { SequelizeComponent } from './sequelize/sequelize.component';
import { TypeOrmComponent } from './typeorm/typeorm.component';

export const DATA_ROUTES: Routes = [
  {
    path: 'overview',
    component: DataOverviewComponent,
    data: { title: 'Databases' },
  },
  {
    path: 'typeorm',
    component: TypeOrmComponent,
    data: { title: 'TypeORM' },
  },
  {
    path: 'sequelize',
    component: SequelizeComponent,
    data: { title: 'Sequelize' },
  },
  {
    path: 'drizzle',
    component: DrizzleComponent,
    data: { title: 'Drizzle' },
  },
  {
    path: 'database',
    redirectTo: splitInto('/data/overview', DATABASE_SECTIONS),
  },
  {
    path: 'mongodb',
    component: MongoComponent,
    data: { title: 'MongoDB' },
  },
  {
    path: 'prisma',
    component: PrismaComponent,
    data: { title: 'Prisma' },
  },
  {
    path: 'mikroorm',
    component: MikroOrmComponent,
    data: { title: 'MikroORM' },
  },
  {
    path: 'caching',
    component: CachingComponent,
    data: { title: 'Caching' },
  },
];
