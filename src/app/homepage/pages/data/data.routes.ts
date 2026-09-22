import { Routes } from '@angular/router';
import { CachingComponent } from './caching/caching.component';
import { MikroOrmComponent } from './mikroorm/mikroorm.component';
import { MongoComponent } from './mongo/mongo.component';
import { PrismaComponent } from './prisma/prisma.component';
import { SqlComponent } from './sql/sql.component';

export const DATA_ROUTES: Routes = [
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
