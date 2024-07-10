### Fedaco ORM

[Fedaco ORM](https://github.com/gradii/fedaco) is a free, open-source tool for Node.js and TypeScript that makes it easier to work with databases. Instead of writing SQL code by hand or using other tools like knex.js, you can use Fedaco. It's designed to work well with PostgreSQL, MySQL, and SQLite, Sql Server.

> info **info** `@gradii/nest-fedaco` is a third party package and is not managed by the NestJS core team. Please report any issues found with the library in the [appropriate repository](https://github.com/gradii/fedaco).

#### Installation

Easiest way to integrate Fedaco to Nest is via [`@gradii/nest-fedaco` module](https://github.com/gradii/fedaco).
Simply install it next to Nest, Fedaco and underlying driver:

```bash
$ npm i @gradii/fedaco @gradii/nest-fedaco better-sqlite3
```

Fedaco also supports `postgres`, `sqlite`, and `mysql`. See the [official docs](https://gradii.github.io/fedaco/) for all drivers.

Once the installation process is completed, we can import the `FedacoModule` into the root `AppModule`.

if you use sqlite database you need to install `better-sqlite3` or `sqlite3` driver


```typescript
import { FedacoModule } from '@gradii/nest-fedaco';

@Module({
  imports: [
    FedacoModule.forRoot({
      'default': {
        driver  : 'sqlite',
        database: ':memory:'
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
```

The `forRoot()` method accepts the same configuration object as key is connection name and value is Fedaco same of ConnectionConfig. Check [this page](https://gradii.github.io/fedaco/database/getting-started.html) for the complete configuration documentation.

#### Multi Connection

multi connction can be defined in `FedacoModule.forRoot` easily. the key is connection name use in `Model` connection, the default model connection name is `default`.

```typescript
import { FedacoModule } from '@gradii/nest-fedaco';

@Module({
  imports: [
    FedacoModule.forRoot({
      'default': {
        driver  : 'sqlite',
        database: ':memory:'
      },
      'second_connection': {
        driver: 'pgsql',
        database: 'nest-postgresql',
        port: 5432
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
```

```typescript
import { Column, CreatedAtColumn, Model, PrimaryGeneratedColumn, Table, UpdatedAtColumn } from '@gradii/fedaco';


@Table({
  tableName: 'users',
  connection: 'second_connection',
})
export class UserModel extends Model {
  _fillable = ['username'];

  @PrimaryGeneratedColumn()
  declare id: string;

  @Column()
  declare username: string;

  @CreatedAtColumn()
  declare created_at: Date;

  @UpdatedAtColumn()
  declare updated_at: Date;
}
```

if want to use difference connection temporarily can use `Model.useConnection('another_connection')`, full document can found [here](https://gradii.github.io/fedaco/model-functions/useConnection.html)

#### Use Query Builder
Fedaco can use query builder by `db` function. to use following `db` to query it need import `FedacoModule` default connection config first.

```typescript
const result = await db().query().from('users').select('*').get()
```

#### Working With Schema Builder
Fedaco can easily work with schema using `schema` function. if you want to create a `users` table
with `id`, `username`, `created_at`, `updated_at` column, can run following script

```typescript
await schema().create('users', table => {
  table.increments('id');
  table.string('username');
  table.timestamps();
});
```
please notice that default table name and column name use snakeCase style.


#### Example

some examples of NestJS with Fedaco ORM can be found [here](https://github.com/gradii/fedaco-examples)
