### MikroORM

[MikroORM](https://mikro-orm.io) is a TypeScript ORM for Node.js based on the Data Mapper, Unit of Work, and Identity Map patterns. It supports MongoDB, MySQL, MariaDB, PostgreSQL, SQLite, Microsoft SQL Server, and Oracle. The `@mikro-orm/nestjs` package integrates it with Nest: it registers the ORM and its `EntityManager` as providers, provides repository injection, creates a request context for every HTTP request, and closes the database connection when the application shuts down.

This chapter covers the Nest-specific parts of the integration. See the [MikroORM documentation](https://mikro-orm.io/docs) for complete coverage of the ORM itself.

> info **Note** `@mikro-orm/nestjs` is a third-party package and is not managed by the NestJS core team. Report any issues with the library in the [mikro-orm/nestjs repository](https://github.com/mikro-orm/nestjs).

> info **Hint** This chapter targets MikroORM v7 and `@mikro-orm/nestjs` v7. If you're upgrading from MikroORM v6, see the [MikroORM v6 to v7 upgrading guide](https://mikro-orm.io/docs/upgrading-v6-to-v7).

#### Installation

Install the Nest module together with MikroORM, its decorators package, and the driver for your database. This chapter uses SQLite:

```bash
$ npm i @mikro-orm/nestjs @mikro-orm/core @mikro-orm/decorators @mikro-orm/sqlite
```

MikroORM provides a driver package for each supported database, such as `@mikro-orm/postgresql`, `@mikro-orm/mysql`, and `@mikro-orm/mongodb`. See the [MikroORM quick start guide](https://mikro-orm.io/docs/quick-start#installation) for the full list.

> info **Hint** Since MikroORM v7, decorators are no longer exported from `@mikro-orm/core`. Nest projects use legacy (experimental) decorators, so import decorators such as `@Entity()` and `@Property()` from `@mikro-orm/decorators/legacy`. Import `EntityManager`, `EntityRepository`, and `MikroORM` from your driver package (e.g., `@mikro-orm/sqlite`), and other types (e.g., the `EntityRepositoryType` symbol) from `@mikro-orm/core`. The snippets in this chapter include the relevant import statements.

Once the installation is complete, import the `MikroOrmModule` into the root `AppModule`:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: SqliteDriver,
      dbName: 'my-db-name.sqlite3',
      entities: ['./dist/**/*.entity.js'],
      entitiesTs: ['./src/**/*.entity.ts'],
      metadataProvider: ReflectMetadataProvider,
    }),
  ],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `MikroORM.init()`. See the [MikroORM configuration documentation](https://mikro-orm.io/docs/configuration) for the complete list of options. The `entities` and `entitiesTs` glob patterns tell MikroORM where to find your entity files: it uses `entitiesTs` when it runs from TypeScript sources and `entities` when it runs from compiled JavaScript (see [folder-based discovery](https://mikro-orm.io/docs/folder-based-discovery)).

> info **Hint** Since MikroORM v7, `ReflectMetadataProvider` is no longer the default metadata provider. Set it explicitly, as shown above, to let MikroORM infer property types from the metadata that TypeScript emits for legacy decorators.

In addition, `forRoot()` supports the following Nest-specific options, all described later in this chapter:

<table>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td>If <code>true</code>, entities registered through <code>forFeature()</code> are added to the configuration automatically (default: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>registerRequestContext</code></td>
    <td>If <code>true</code>, registers a middleware that creates a request context for every HTTP request (default: <code>true</code>)</td>
  </tr>
  <tr>
    <td><code>forRoutesPath</code></td>
    <td>The route path that the request context middleware applies to (default: all routes)</td>
  </tr>
  <tr>
    <td><code>scope</code></td>
    <td>The <a href="/fundamentals/injection-scopes">injection scope</a> of the <code>EntityManager</code> provider (default: <code>Scope.DEFAULT</code>)</td>
  </tr>
  <tr>
    <td><code>contextName</code></td>
    <td>The name of the connection, required when you connect to <a href="/data/mikroorm#multiple-databases">multiple databases</a></td>
  </tr>
</table>

Alternatively, you can keep your configuration in a separate `mikro-orm.config.ts` file, which the [MikroORM CLI](https://mikro-orm.io/docs/quick-start#setting-up-the-commandline-tool) uses as well. The `defineConfig()` helper exported by your driver package sets the `driver` option for you:

```typescript
// mikro-orm.config.ts
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { defineConfig } from '@mikro-orm/sqlite';

export default defineConfig({
  dbName: 'my-db-name.sqlite3',
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  metadataProvider: ReflectMetadataProvider,
});
```

Then pass the configuration to `forRoot()`. Since MikroORM v7, `forRoot()` no longer accepts an empty argument list, so you must pass the configuration explicitly:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config.js';

@Module({
  imports: [MikroOrmModule.forRoot(config)],
})
export class AppModule {}
```

Afterward, the `MikroORM` and `EntityManager` objects are available for injection across the entire project, without importing any module elsewhere:

```typescript
import { Injectable } from '@nestjs/common';
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';

@Injectable()
export class AppService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
  ) {}
}
```

> info **Note** Import `EntityManager` and `MikroORM` from the `@mikro-orm/<driver>` package, where `<driver>` is `sqlite`, `postgresql`, `mysql`, or whichever driver you use, to get the driver-specific API. If you have `@mikro-orm/sql` installed as a dependency, you can also import the `EntityManager` from there. The generic classes exported by `@mikro-orm/core` are registered as injection tokens as well.

#### Repositories

MikroORM supports the repository design pattern, so each entity has its own repository. See the [MikroORM repositories documentation](https://mikro-orm.io/docs/repositories) for details. To continue the example, define a `Photo` entity:

```typescript
// photo/photo.entity.ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
export class Photo {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;
}
```

> info **Hint** Besides decorators, MikroORM can define entities with the `defineEntity()` helper or the `EntitySchema` class. Learn more in the [MikroORM defining entities guide](https://mikro-orm.io/docs/defining-entities).

To define which repositories are registered in the current scope, use the `forFeature()` method:

```typescript
// photo/photo.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Photo } from './photo.entity.js';
import { PhotoService } from './photo.service.js';
import { PhotoController } from './photo.controller.js';

@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

> info **Note** Don't register your base entities via `forFeature()`, as there are no repositories for them. Base entities do, however, need to be part of the ORM configuration (e.g., the `entities` option of `forRoot()`).

Then import the `PhotoModule` into the root `AppModule`:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config.js';
import { PhotoModule } from './photo/photo.module.js';

@Module({
  imports: [MikroOrmModule.forRoot(config), PhotoModule],
})
export class AppModule {}
```

You can now inject the `Photo` repository into the `PhotoService` using the `@InjectRepository()` decorator:

```typescript
// photo/photo.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Photo } from './photo.entity.js';

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>,
    private readonly em: EntityManager,
  ) {}

  findAll(): Promise<Photo[]> {
    return this.photoRepository.findAll();
  }

  findOne(id: number): Promise<Photo | null> {
    return this.photoRepository.findOne({ id });
  }

  async create(name: string): Promise<Photo> {
    const photo = this.photoRepository.create({ name });
    await this.em.flush();
    return photo;
  }

  async remove(id: number): Promise<void> {
    const photo = await this.photoRepository.findOneOrFail({ id });
    await this.em.remove(photo).flush();
  }
}
```

Repositories don't have `persist()` or `flush()` methods, so write operations go through the `EntityManager`, which implements the [Unit of Work](https://mikro-orm.io/docs/unit-of-work) pattern. The repository's `create()` method marks the new entity for persistence, and `em.flush()` writes all pending changes to the database in a single transaction.

#### Using custom repositories

To add your own query methods, extend `EntityRepository` and point the entity to your class through the `repository` option:

```typescript
// author/author.entity.ts
import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { AuthorRepository } from './author.repository.js';

@Entity({ repository: () => AuthorRepository })
export class Author {
  // enables type inference in `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;

  @PrimaryKey()
  id: number;

  @Property()
  name: string;
}
```

```typescript
// author/author.repository.ts
import { EntityRepository } from '@mikro-orm/sqlite';
import { Author } from './author.entity.js';

export class AuthorRepository extends EntityRepository<Author> {
  findByName(name: string): Promise<Author | null> {
    return this.findOne({ name });
  }
}
```

When you pass the `Author` entity to `forFeature()`, the module also registers the custom repository class itself as a provider. You can therefore inject it by its class, without the `@InjectRepository()` decorator:

```typescript
@Injectable()
export class AuthorService {
  constructor(private readonly authorRepository: AuthorRepository) {}
}
```

#### Load entities automatically

Manually adding entities to the `entities` array of the configuration can be tedious. In addition, referencing entities from the root module breaks application domain boundaries and leaks implementation details to other parts of the application. Glob paths solve this issue, but they don't work when you bundle your application (e.g., in a [monorepo](/cli/monorepo)): MikroORM looks up the matching files at runtime, and a bundle doesn't contain them as separate files.

As an alternative, you can load entities automatically by setting the `autoLoadEntities` property of the configuration object (passed into the `forRoot()` method) to `true`, as shown below:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: SqliteDriver,
      dbName: 'my-db-name.sqlite3',
      metadataProvider: ReflectMetadataProvider,
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

With this option enabled, every entity registered through the `forFeature()` method is automatically added to the `entities` array of the configuration object.

> info **Note** Entities that aren't registered through the `forFeature()` method, but are only referenced from an entity (via a relationship), won't be included by the `autoLoadEntities` setting.

> info **Note** `autoLoadEntities` has no effect on the MikroORM CLI, which still needs a CLI config with the full list of entities. You can use globs there, however, as the CLI doesn't run your bundle.

#### Request context

MikroORM keeps loaded entities in an [identity map](https://mikro-orm.io/docs/identity-map), which must not be shared between concurrent requests. Each request needs its own fork of the `EntityManager`, with a clean identity map. The `MikroOrmModule` handles this for you: it registers a middleware for all routes that runs each HTTP request inside a `RequestContext`. Within that context, the global `EntityManager` that you inject (and every repository that depends on it) transparently delegates to the request's fork.

Outside of a request context, MikroORM refuses to use the global `EntityManager` for operations that depend on the identity map, such as `find()` or `flush()`, and throws a `ValidationError`. The [next section](/data/mikroorm#request-scoped-handlers-in-queues) shows how to create a context for code that doesn't run as part of an HTTP request.

To apply the middleware to a subset of routes only, set the `forRoutesPath` option. To disable it, set `registerRequestContext` to `false`. For example, instead of using the middleware, you can let Nest create an `EntityManager` fork for every request by making the `EntityManager` provider [request-scoped](/fundamentals/injection-scopes):

```typescript
// app.module.ts
import { Module, Scope } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config.js';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...config,
      registerRequestContext: false,
      scope: Scope.REQUEST,
    }),
  ],
})
export class AppModule {}
```

> warning **Warning** With `scope: Scope.REQUEST`, every provider that depends on the `EntityManager` (including repositories) becomes request-scoped as well. This affects performance, as described in the [injection scopes chapter](/fundamentals/injection-scopes#performance).

#### Request scoped handlers in queues

Middleware only runs for HTTP requests. Code outside of that flow, such as [queue](/application/queues) consumers and [scheduled tasks](/application/task-scheduling), has no request context, so you need to create one yourself.

For these methods, use the `@CreateRequestContext()` decorator. It forks the `EntityManager` and runs the decorated `async` method inside a new context. The decorator looks up the `EntityManager` through the `orm` property (a `MikroORM` instance) or the `em` property (an `EntityManager`) of the class, so inject one of them under that name:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { Photo } from './photo.entity.js';

@Injectable()
export class PhotoStatsService {
  private readonly logger = new Logger(PhotoStatsService.name);

  constructor(private readonly orm: MikroORM) {}

  @Cron(CronExpression.EVERY_HOUR)
  @CreateRequestContext()
  async logPhotoCount() {
    // runs in a separate context, with its own identity map
    const count = await this.orm.em.count(Photo);
    this.logger.log(`Found ${count} photos`);
  }
}
```

> warning **Warning** Place `@CreateRequestContext()` directly above the method, below other method decorators such as `@Cron()`. The decorator replaces the method with a wrapper. Decorators listed above it attach their metadata to that wrapper, but decorators listed below it attach their metadata to the original method, which Nest never sees (in this example, the cron job wouldn't be registered).

> info **Note** As the name suggests, this decorator always creates a new context, as opposed to its alternative `@EnsureRequestContext()`, which creates one only if the method isn't already running inside another context. Before MikroORM v6, `@CreateRequestContext()` was called `@UseRequestContext()`, and before v7, it was exported from `@mikro-orm/core`.

#### Transactions

MikroORM queues all write operations until you call `em.flush()`, which then wraps them in a single transaction. To control the transaction boundaries yourself, for example, to flush several times or to combine the changes with other queries, use the `em.transactional()` method:

```typescript
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/sqlite';
import { Photo } from './photo.entity.js';

@Injectable()
export class PhotoService {
  constructor(private readonly em: EntityManager) {}

  async createMany(names: string[]): Promise<void> {
    await this.em.transactional(async (em) => {
      for (const name of names) {
        em.create(Photo, { name });
      }
    });
  }
}
```

The callback receives a forked `EntityManager` that runs inside the transaction. When the callback completes, MikroORM flushes the fork and commits the transaction. If the callback throws, MikroORM rolls the transaction back and rethrows the error.

Alternatively, use the `@Transactional()` decorator, which wraps the decorated `async` method in `em.transactional()`:

```typescript
import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/decorators/legacy';
import { EntityManager } from '@mikro-orm/sqlite';
import { Photo } from './photo.entity.js';

@Injectable()
export class PhotoService {
  constructor(private readonly em: EntityManager) {}

  @Transactional()
  async createMany(names: string[]): Promise<void> {
    for (const name of names) {
      this.em.create(Photo, { name });
    }
  }
}
```

Like `@CreateRequestContext()`, the decorator finds the `EntityManager` through the `em` or `orm` property of the class, and falls back to the current context if the class has neither. When called inside another transaction, `em.transactional()` starts a nested transaction (a savepoint), while `@Transactional()` joins the existing transaction by default. See the [MikroORM transactions documentation](https://mikro-orm.io/docs/transactions) for propagation options, isolation levels, and locking.

#### Serialization

MikroORM entities have a `toJSON()` method that applies MikroORM's [serialization rules](https://mikro-orm.io/docs/serializing): it omits hidden properties, applies custom property serializers, and serializes populated relations as nested objects and unpopulated relations as their primary keys. When a route handler returns an entity, Nest converts it to JSON, so these rules apply automatically.

> warning **Warning** Don't use [Nest's built-in serializer](/application/serialization) (the `ClassSerializerInterceptor`) with MikroORM entities. It relies on `class-transformer`, which doesn't understand the wrappers that MikroORM uses for relations: it serializes the internal structure of a `Reference`, and traversing a `Collection` leads to infinite recursion (a "Maximum call stack size exceeded" error).

Instead, configure serialization on the entity with MikroORM's options:

```typescript
// book/book.entity.ts
import { type Rel } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Author } from '../author/author.entity.js';

@Entity()
export class Book {
  @PrimaryKey()
  id: number;

  @Property()
  title: string;

  @Property({ hidden: true }) // Equivalent of class-transformer's `@Exclude()`
  hiddenField: number = Date.now();

  @Property({ persist: false }) // Similar to class-transformer's `@Expose()`. Only exists in memory, but is serialized.
  count?: number;

  @ManyToOne(() => Author, {
    serializer: (author: Author) => author.name,
    serializedName: 'authorName',
  }) // Equivalent of class-transformer's `@Transform()`
  author: Rel<Author>;
}
```

> info **Hint** When entities reference each other, wrap the relation's type in `Rel<T>` (or use `Ref<T>`) from `@mikro-orm/core`, and pass the target entity to the relation decorator, as shown above. Otherwise, TypeScript emits decorator metadata that references the related class directly. In ESM projects, the circular imports between entity files then fail at startup with a `ReferenceError` (e.g., "Cannot access 'Author' before initialization").

To control serialization for a single route handler, convert the entity explicitly with the `serialize()` function, which is exported by your driver package and by `@mikro-orm/core`. It accepts options such as `populate`, `exclude`, `fields`, and `groups`:

```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  const book = await this.em.findOneOrFail(Book, { id }, { populate: ['author'] });
  return serialize(book, { fields: ['title', 'author'] }); // { title: '...', authorName: '...' }
}
```

To get a plain object with the default rules applied, call `wrap(entity).toObject()`.

#### Multiple databases

To connect to multiple databases, call `MikroOrmModule.forRoot()` once per database, and give each connection a unique `contextName`. In this setup, set `registerRequestContext` to `false` on every connection, because the default middleware only works with a single, unnamed connection. Instead, import `MikroOrmModule.forMiddleware()` once. Its middleware creates a request context that covers all connections:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Album } from './album/album.entity.js';
import { Photo } from './photo/photo.entity.js';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      contextName: 'photos',
      registerRequestContext: false,
      driver: SqliteDriver,
      dbName: 'photos.sqlite3',
      entities: [Photo],
      metadataProvider: ReflectMetadataProvider,
    }),
    MikroOrmModule.forRoot({
      contextName: 'albums',
      registerRequestContext: false,
      driver: SqliteDriver,
      dbName: 'albums.sqlite3',
      entities: [Album],
      metadataProvider: ReflectMetadataProvider,
    }),
    MikroOrmModule.forMiddleware(),
  ],
})
export class AppModule {}
```

> warning **Notice** If you use `MikroOrmModule.forRootAsync()`, set the `contextName` next to `useFactory`, not inside the options object that the factory returns.

With this setup, pass the context name to the `forFeature()` method and the `@InjectRepository()` decorator:

```typescript
// album/album.module.ts
@Module({
  imports: [MikroOrmModule.forFeature([Album], 'albums')],
  providers: [AlbumService],
})
export class AlbumModule {}
```

To inject the `MikroORM` or `EntityManager` of a specific connection, use the `@InjectMikroORM()` and `@InjectEntityManager()` decorators:

```typescript
// album/album.service.ts
import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectMikroORM, InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/sqlite';
import { Album } from './album.entity.js';

@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(Album, 'albums')
    private readonly albumRepository: EntityRepository<Album>,
    @InjectEntityManager('albums')
    private readonly em: EntityManager,
    @InjectMikroORM('albums')
    private readonly orm: MikroORM,
  ) {}
}
```

To inject all registered `MikroORM` instances as an array, use the `@InjectMikroORMs()` decorator.

#### Testing

When unit testing an application, you usually want to avoid a database connection, which keeps test suites independent and fast. However, your classes might depend on repositories and the `EntityManager`. To resolve these classes, provide mock implementations using [custom providers](/fundamentals/custom-providers).

The `@mikro-orm/nestjs` package exposes a `getRepositoryToken()` function that returns a prepared injection token based on a given entity (e.g., `'PhotoRepository'` for the `Photo` entity), allowing you to mock the repository. For a custom repository, use its class as the token:

```typescript
import { Module } from '@nestjs/common';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/sqlite';
import { Photo } from './photo.entity.js';
import { PhotoService } from './photo.service.js';

@Module({
  providers: [
    PhotoService,
    {
      // or, for a custom repository: `provide: PhotoRepository`
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
    {
      provide: EntityManager,
      useValue: mockedEntityManager,
    },
  ],
})
export class PhotoModule {}
```

Now the `mockedRepository` object is injected wherever a class in this module asks for the `Photo` repository using the `@InjectRepository(Photo)` decorator. For [multiple databases](/data/mikroorm#multiple-databases), pass the context name as the second argument, e.g., `getRepositoryToken(Album, 'albums')`.

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `forRootAsync()` method. As with most dynamic modules, Nest provides several techniques for async configuration.

One technique is to use a factory function. Like other [factory providers](/fundamentals/custom-providers#factory-providers-usefactory), the factory function can be `async` and can inject dependencies through `inject`:

```typescript
MikroOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    dbName: configService.getOrThrow<string>('DB_NAME'),
    autoLoadEntities: true,
    metadataProvider: ReflectMetadataProvider,
  }),
  inject: [ConfigService],
  driver: SqliteDriver,
});
```

> warning **Warning** Set the `driver` option next to `useFactory`, as shown above. The module needs to know the driver before it calls the factory, to register the driver-specific `EntityManager` and `MikroORM` classes as injection tokens. Without it, injecting the `EntityManager` from your driver package fails with a dependency resolution error.

Alternatively, you can configure the `MikroOrmModule` using a class instead of a factory, as shown below:

```typescript
MikroOrmModule.forRootAsync({
  useClass: MikroOrmConfigService,
  driver: SqliteDriver,
});
```

The construction above instantiates `MikroOrmConfigService` inside `MikroOrmModule`, using it to create the required options object. In this example, the `MikroOrmConfigService` has to implement the `MikroOrmOptionsFactory` interface, as shown below. The `MikroOrmModule` calls the `createMikroOrmOptions()` method on the instantiated object of the supplied class.

```typescript
import { Injectable } from '@nestjs/common';
import { MikroOrmModuleOptions, MikroOrmOptionsFactory } from '@mikro-orm/nestjs';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Injectable()
export class MikroOrmConfigService implements MikroOrmOptionsFactory {
  createMikroOrmOptions(): MikroOrmModuleOptions {
    return {
      dbName: 'my-db-name.sqlite3',
      autoLoadEntities: true,
      metadataProvider: ReflectMetadataProvider,
    };
  }
}
```

To reuse an existing options provider instead of creating a private copy inside the `MikroOrmModule`, use the `useExisting` syntax. The provider must implement the `MikroOrmOptionsFactory` interface, and a module listed in `imports` must export it:

```typescript
MikroOrmModule.forRootAsync({
  imports: [DatabaseConfigModule],
  useExisting: MikroOrmConfigService,
  driver: SqliteDriver,
});
```

#### Application shutdown

The `MikroOrmModule` closes the ORM and its database connection in the `onApplicationShutdown()` lifecycle hook, which Nest calls when you call `app.close()`. By default, however, Nest doesn't listen for process termination signals such as `SIGTERM`, so the connection isn't closed when the process is terminated. To close it in that case too, enable [shutdown hooks](/fundamentals/lifecycle-events#application-shutdown):

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

#### Example

For complete applications that use NestJS with MikroORM, see the [nestjs-realworld-example-app](https://github.com/mikro-orm/nestjs-realworld-example-app) and [nestjs-example-app](https://github.com/mikro-orm/nestjs-example-app) repositories.
