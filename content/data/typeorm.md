### TypeORM

The `@nestjs/typeorm` package integrates [TypeORM](https://github.com/typeorm/typeorm) with Nest. TypeORM is one of the most mature Object Relational Mappers (ORMs) available for TypeScript. Because it's written in TypeScript, it integrates well with Nest.

To get started, install the required dependencies. This chapter uses [MySQL](https://www.mysql.com/), but TypeORM supports many other relational databases, such as PostgreSQL, Oracle, Microsoft SQL Server, and SQLite, as well as NoSQL databases like MongoDB. The steps in this chapter are the same for every database TypeORM supports; you only need to install the client library for your database.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql2
```

Once the installation is complete, import `TypeOrmModule` into the root `AppModule`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** Don't use `synchronize: true` in production; otherwise, you can lose production data.

The `forRoot()` method accepts all the configuration properties supported by the TypeORM [`DataSource` constructor](https://typeorm.io/docs/data-source/data-source-options#common-data-source-options). It also accepts the following extra properties:

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Number of attempts to connect to the database (default: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Delay between connection retry attempts, in milliseconds (default: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>toRetry</code></td>
    <td>Function that receives the connection error and returns whether to retry. By default, every error is retried</td>
  </tr>
  <tr>
    <td><code>verboseRetryLog</code></td>
    <td>If <code>true</code>, the error message is included in the log entry for each connection retry (default: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td>If <code>true</code>, entities are loaded automatically (default: <code>false</code>). See <a href="/data/typeorm#auto-load-entities">Auto-load entities</a></td>
  </tr>
  <tr>
    <td><code>manualInitialization</code></td>
    <td>If <code>true</code>, the data source isn't initialized during module initialization, so no connection is established and no migrations run. You must call <code>DataSource.initialize()</code> yourself and handle retries if needed (default: <code>false</code>)</td>
  </tr>
</table>

> info **Hint** Learn more about the available options in the [TypeORM data source options](https://typeorm.io/docs/data-source/data-source-options) documentation.

Once this is done, you can inject the TypeORM `DataSource` and `EntityManager` objects anywhere in the project, without importing any modules. For example:

```typescript
@@filename(app.module)
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
@@switch
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
}
```

#### Repository pattern

[TypeORM](https://github.com/typeorm/typeorm) supports the **repository design pattern**, so each entity has its own repository. You obtain these repositories from the data source.

To continue the example, we need at least one entity. Let's define the `User` entity.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
```

> info **Hint** Learn more about entities in the [TypeORM documentation](https://typeorm.io/docs/entity/entities/).

The `User` entity file sits in the `users` directory, which contains all files related to the `UsersModule`. You can keep your model files wherever you like, but we recommend placing them near their **domain**, in the corresponding module directory.

To start using the `User` entity, let TypeORM know about it by adding it to the `entities` array in the `forRoot()` options (unless you use a static glob path):

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Next, let's look at the `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { User } from './user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

This module uses the `forFeature()` method to define which repositories are registered in the current scope. With that in place, you can inject the `User` repository into `UsersService` with the `@InjectRepository()` decorator:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity.js';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id) {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id) {
    await this.usersRepository.delete(id);
  }
}
```

> warning **Notice** Don't forget to import the `UsersModule` into the root `AppModule`.

To use the repository outside the module that imports `TypeOrmModule.forFeature()`, re-export the providers it generates. You can do this by exporting the whole module:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UsersModule {}
```

Now, if you import `UsersModule` into `UserHttpModule`, you can use `@InjectRepository(User)` in the latter module's providers:

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

Relations are associations between two or more tables, based on common fields from each table, often involving primary and foreign keys.

There are three types of relations:

<table>
  <tr>
    <td><code>One-to-one</code></td>
    <td>Every row in the primary table has one and only one associated row in the foreign table. Use the <code>@OneToOne()</code> decorator to define this type of relation.</td>
  </tr>
  <tr>
    <td><code>One-to-many / Many-to-one</code></td>
    <td>Every row in the primary table has one or more related rows in the foreign table. Use the <code>@OneToMany()</code> and <code>@ManyToOne()</code> decorators to define this type of relation.</td>
  </tr>
  <tr>
    <td><code>Many-to-many</code></td>
    <td>Every row in the primary table has many related rows in the foreign table, and every row in the foreign table has many related rows in the primary table. Use the <code>@ManyToMany()</code> decorator to define this type of relation.</td>
  </tr>
</table>

To define relations in entities, use the corresponding **decorators**. For example, to define that each `User` can have multiple photos, use the `@OneToMany()` decorator.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
```

> info **Hint** To learn more about relations in TypeORM, visit the [TypeORM documentation](https://typeorm.io/docs/relations/relations).

#### Auto-load entities

Manually adding entities to the `entities` array of the data source options can be tedious. In addition, referencing entities from the root module breaks application domain boundaries and leaks implementation details to other parts of the application. To avoid this, set the `autoLoadEntities` property of the options object passed to `forRoot()` to `true`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

With this option enabled, every entity registered through the `forFeature()` method is automatically added to the `entities` array of the data source options.

> warning **Warning** Entities that aren't registered through `forFeature()`, and are only referenced from another entity (via a relation), aren't included by the `autoLoadEntities` setting.

#### Separating entity definition

You can define an entity and its columns directly in the model class, using decorators. Alternatively, you can define entities and their columns in separate files using [entity schemas](https://typeorm.io/docs/entity/separating-entity-definition).

```typescript
import { EntitySchema } from 'typeorm';
import { User } from './user.entity.js';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // the name of the PhotoSchema
    },
  },
});
```

> warning **Warning** If you provide the `target` option, the `name` option must match the name of the target class. If you don't provide `target`, you can use any name.

Nest lets you use an `EntitySchema` instance wherever an entity class is expected. For example:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### TypeORM Transactions

A [database transaction](https://en.wikipedia.org/wiki/Database_transaction) is a unit of work performed against a database and treated in a coherent and reliable way, independent of other transactions. A transaction generally represents any change in a database.

There are several strategies for handling [TypeORM transactions](https://typeorm.io/docs/advanced-topics/transactions/). We recommend the `QueryRunner` class, because it gives you full control over the transaction.

First, inject the `DataSource` object into a class as usual:

```typescript
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}
}
```

> info **Hint** The `DataSource` class is imported from the `typeorm` package.

Then use it to create a transaction:

```typescript
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // since we have errors, roll back the changes we made
    await queryRunner.rollbackTransaction();
  } finally {
    // you need to release a manually instantiated query runner
    await queryRunner.release();
  }
}
```

> info **Hint** The `dataSource` is used only to create the `QueryRunner`. However, testing this class would require mocking the entire `DataSource` object, which exposes many methods. Instead, we recommend a helper factory class (e.g., `QueryRunnerFactory`) that implements an interface with only the methods needed to manage transactions. This makes those methods straightforward to mock.

<app-banner-devtools></app-banner-devtools>

Alternatively, you can use the callback-style `transaction()` method of the `DataSource` object (see [Creating and using transactions](https://typeorm.io/docs/advanced-topics/transactions/#creating-and-using-transactions) in the TypeORM documentation):

```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

#### Subscribers

With TypeORM [subscribers](https://typeorm.io/docs/advanced-topics/listeners-and-subscribers#what-is-a-subscriber), you can listen to specific entity events.

```typescript
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { User } from './user.entity.js';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: `, event.entity);
  }
}
```

> error **Warning** Event subscribers cannot be [request-scoped](/fundamentals/injection-scopes).

Now, add the `UserSubscriber` class to the `providers` array:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UserSubscriber } from './user.subscriber.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### Migrations

[Migrations](https://typeorm.io/docs/advanced-topics/migrations/) provide a way to incrementally update the database schema to keep it in sync with the application's data model while preserving existing data in the database. To generate, run, and revert migrations, TypeORM provides a dedicated [CLI](https://typeorm.io/docs/advanced-topics/migrations/#creating-a-new-migration).

Migration classes are separate from the Nest application source code, and TypeORM manages their lifecycle. Therefore, you can't use dependency injection or other Nest-specific features in migrations. To learn more, see the [migrations guide](https://typeorm.io/docs/advanced-topics/migrations/) in the TypeORM documentation.

#### Multiple databases

Some projects require multiple database connections, which this module also supports. To work with multiple connections, first create them. In this case, every data source other than the default one must have a unique **name**.

Suppose you have an `Album` entity stored in its own database.

```typescript
const defaultOptions = {
  type: 'postgres' as const,
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Notice** If you don't set a `name` for a data source, its name is `default`. Don't register multiple data sources without a name, or with the same name; otherwise, they override each other.

> warning **Notice** If you use `TypeOrmModule.forRootAsync()`, you must **also** set the data source name outside `useFactory`. For example:
>
> ```typescript
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
>
> For more details, see [nestjs/typeorm issue #86](https://github.com/nestjs/typeorm/issues/86).

At this point, the `User` and `Album` entities are each registered with their own data source. With this setup, you have to tell the `TypeOrmModule.forFeature()` method and the `@InjectRepository()` decorator which data source to use. If you don't pass a data source name, the `default` data source is used.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

You can also inject the `DataSource` or `EntityManager` for a given data source:

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
    @InjectEntityManager('albumsConnection')
    private entityManager: EntityManager,
  ) {}
}
```

You can also inject any `DataSource` into a factory provider by using the `getDataSourceToken()` function:

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsConnection: DataSource) => {
        return new AlbumsService(albumsConnection);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Testing

When unit testing an application, you usually want to avoid connecting to a database, to keep test suites independent and as fast as possible. However, your classes might depend on repositories obtained from the data source instance. The solution is to create mock repositories using [custom providers](/fundamentals/custom-providers). Each registered repository is automatically represented by an `<EntityName>Repository` token, where `EntityName` is the name of your entity class.

The `@nestjs/typeorm` package exports the `getRepositoryToken()` function, which returns this token for a given entity. For a named data source, pass the data source name as the second argument.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

Now `mockRepository` is used as the `User` repository. Whenever a class injects it with `@InjectRepository(User)`, Nest provides the registered `mockRepository` object.

#### Async configuration

You may want to pass the module options asynchronously instead of statically. In this case, use the `forRootAsync()` method, which supports several ways to provide async configuration.

One approach is to use a factory function:

```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
```

The factory behaves like any other [asynchronous provider](/fundamentals/async-providers) (e.g., it can be `async`, and it can inject dependencies through `inject`).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

Alternatively, you can use the `useClass` syntax:

```typescript
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
```

The construction above instantiates `TypeOrmConfigService` inside `TypeOrmModule` and uses it to create the options object by calling `createTypeOrmOptions()`. This means that `TypeOrmConfigService` has to implement the `TypeOrmOptionsFactory` interface:

```typescript
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}
```

To reuse a provider imported from a different module instead of creating `TypeOrmConfigService` inside `TypeOrmModule`, use the `useExisting` syntax:

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This works the same as `useClass`, with one critical difference: `TypeOrmModule` looks up imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

> info **Hint** Define the `name` property at the same level as the `useFactory`, `useClass`, or `useExisting` property. This lets Nest register the data source under the appropriate injection token.

#### Custom DataSource Factory

Together with async configuration (`useFactory`, `useClass`, or `useExisting`), you can optionally specify a `dataSourceFactory` function to provide your own TypeORM data source instead of letting `TypeOrmModule` create it.

`dataSourceFactory` receives the TypeORM `DataSourceOptions` resolved by the async configuration and returns a `Promise` that resolves to a TypeORM `DataSource`. If the returned data source isn't initialized yet, `TypeOrmModule` initializes it (unless `manualInitialization` is set).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Use useFactory, useClass, or useExisting
  // to configure the DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSourceFactory receives the configured DataSourceOptions
  // and returns a Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options!).initialize();
    return dataSource;
  },
});
```

> info **Hint** The `DataSource` class is imported from the `typeorm` package.

#### Example

A working example is available in the [TypeORM sample application](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm) in the NestJS repository.

<app-banner-enterprise></app-banner-enterprise>
