### MikroORM

This chapter helps you get started with MikroORM in Nest. MikroORM is a TypeScript ORM for Node.js based on the Data Mapper, Unit of Work, and Identity Map patterns. It's a good alternative to TypeORM, and migrating from TypeORM is relatively straightforward. See the [MikroORM documentation](https://mikro-orm.io/docs) for complete coverage of the ORM.

> info **Note** `@mikro-orm/nestjs` is a third-party package and is not managed by the NestJS core team. Please report any issues with the library in the [@mikro-orm/nestjs repository](https://github.com/mikro-orm/nestjs).

#### Installation

The easiest way to integrate MikroORM with Nest is the [`@mikro-orm/nestjs` module](https://github.com/mikro-orm/nestjs). Install it alongside MikroORM, the MikroORM decorators package, and the underlying driver:

```bash
$ npm i @mikro-orm/core @mikro-orm/nestjs @mikro-orm/decorators @mikro-orm/sqlite
```

MikroORM also supports other drivers, such as `postgresql`, `mysql`, and `mongodb`. See the [official docs](https://mikro-orm.io/docs/usage-with-sql) for the full list of drivers.

> info **Hint** Since MikroORM v7, decorators are no longer exported from `@mikro-orm/core`. Nest projects use legacy (experimental) decorators, so import decorators such as `@Entity()` and `@Property()` from `@mikro-orm/decorators/legacy`. Import `EntityManager`, `EntityRepository`, and `MikroORM` from your driver package (e.g., `@mikro-orm/sqlite`), and other types (e.g., the `EntityRepositoryType` symbol) from `@mikro-orm/core`. The `MikroOrmModule` itself is exported by `@mikro-orm/nestjs`. The snippets below include the relevant import statements.

Once the installation is complete, import the `MikroOrmModule` into the root `AppModule`:

```typescript
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      entities: ['./dist/entities'],
      entitiesTs: ['./src/entities'],
      dbName: 'my-db-name.sqlite3',
      driver: SqliteDriver,
      metadataProvider: ReflectMetadataProvider,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `init()` from the MikroORM package. See the [MikroORM configuration documentation](https://mikro-orm.io/docs/configuration) for the complete list of options.

> info **Hint** Since MikroORM v7, the `ReflectMetadataProvider` is no longer the default metadata provider. Set it explicitly, as shown above, to let MikroORM infer property types from the metadata that TypeScript emits for legacy decorators.

Alternatively, you can keep your configuration in a separate `mikro-orm.config.ts` file (which the [MikroORM CLI](https://mikro-orm.io/docs/installation#setting-up-the-commandline-tool) uses as well), and pass it to `forRoot()`. Since MikroORM v7, `forRoot()` no longer accepts an empty argument list, so you must pass the configuration explicitly:

```typescript
import { MikroOrmModule } from '@mikro-orm/nestjs';
import config from './mikro-orm.config.js'; // your ORM config

@Module({
  imports: [
    MikroOrmModule.forRoot(config),
  ],
  ...
})
export class AppModule {}
```

Afterward, the `EntityManager` is available for injection across the entire project (without importing any module elsewhere):

```ts
// Import everything from your driver package or `@mikro-orm/sql`
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';

@Injectable()
export class MyService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
  ) {}
}
```

> info **Note** The `EntityManager` is imported from the `@mikro-orm/<driver>` package, where `<driver>` is `mysql`, `sqlite`, `postgresql`, or whichever driver you use. If you have `@mikro-orm/sql` installed as a dependency, you can also import the `EntityManager` from there.

#### Repositories

MikroORM supports the repository design pattern: you can create a repository for every entity. See the [MikroORM repositories documentation](https://mikro-orm.io/docs/repositories) for details. To define which repositories should be registered in the current scope, use the `forFeature()` method, as follows:

> info **Note** Don't register your base entities via `forFeature()`, as there are no repositories for them. Base entities do, however, need to be part of the list in `forRoot()` (or in the ORM config in general).

```typescript
// photo.module.ts
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [MikroOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

Then import it into the root `AppModule`:

```typescript
// app.module.ts
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [MikroOrmModule.forRoot(...), PhotoModule],
})
export class AppModule {}
```

You can now inject the `Photo` repository into the `PhotoService` using the `@InjectRepository()` decorator:

```typescript
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/sqlite'; // import from your driver package

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: EntityRepository<Photo>,
  ) {}
}
```

#### Using custom repositories

When you use custom repositories, you no longer need the `@InjectRepository()` decorator, because Nest resolves the dependencies based on the class references.

```ts
// `**./author.entity.ts**`
import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity } from '@mikro-orm/decorators/legacy';

@Entity({ repository: () => AuthorRepository })
export class Author {
  // to allow inference in `em.getRepository()`
  [EntityRepositoryType]?: AuthorRepository;
}

// `**./author.repository.ts**`
import { EntityRepository } from '@mikro-orm/sqlite'; // import from your driver package

export class AuthorRepository extends EntityRepository<Author> {
  // your custom methods...
}
```

Since the custom repository name is the same as what `getRepositoryToken()` returns, you don't need the `@InjectRepository()` decorator:

```ts
@Injectable()
export class MyService {
  constructor(private readonly repo: AuthorRepository) {}
}
```

#### Load entities automatically

Manually adding entities to the `entities` array of the connection options can be tedious. In addition, referencing entities from the root module breaks application domain boundaries and leaks implementation details to other parts of the application. Static glob paths solve this issue.

However, webpack doesn't support glob paths, so you can't use them if you build your application within a monorepo. As an alternative, you can load entities automatically by setting the `autoLoadEntities` property of the configuration object (passed into the `forRoot()` method) to `true`, as shown below:

```ts
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

With this option enabled, every entity registered through the `forFeature()` method is automatically added to the `entities` array of the configuration object.

> info **Note** Entities that aren't registered through the `forFeature()` method, but are only referenced from an entity (via a relationship), won't be included by the `autoLoadEntities` setting.

> info **Note** `autoLoadEntities` has no effect on the MikroORM CLI, which still needs a CLI config with the full list of entities. You can use globs there, however, as the CLI doesn't go through webpack.

#### Serialization

> warning **Warning** MikroORM wraps every entity relation in a `Reference<T>` or a `Collection<T>` object to provide better type safety. This makes [Nest's built-in serializer](/application/serialization) blind to any wrapped relations. In other words, if you return MikroORM entities from your HTTP or WebSocket handlers, none of their relations are serialized.

Instead, use the MikroORM [serialization API](https://mikro-orm.io/docs/serializing) in place of the `ClassSerializerInterceptor`.

```typescript
import { Entity, Property, ManyToOne } from '@mikro-orm/decorators/legacy';

@Entity()
export class Book {
  @Property({ hidden: true }) // Equivalent of class-transformer's `@Exclude`
  hiddenField: number = Date.now();

  @Property({ persist: false }) // Similar to class-transformer's `@Expose()`. Will only exist in memory, and will be serialized.
  count?: number;

  @ManyToOne({
    serializer: (value) => value.name,
    serializedName: 'authorName',
  }) // Equivalent of class-transformer's `@Transform()`
  author: Author;
}
```

#### Request scoped handlers in queues

As explained in the [MikroORM identity map documentation](https://mikro-orm.io/docs/identity-map), each request needs a clean state. This is handled automatically by the `RequestContext` helper, which is registered via middleware.

However, middleware only runs for regular HTTP request handlers. Methods outside of that flow, such as queue handlers or scheduled tasks, need a different approach.

For these, use the `@CreateRequestContext()` decorator. It requires you to first inject the `MikroORM` instance into the current context, which the decorator then uses to create the context for you. Under the hood, the decorator registers a new request context for your method and executes the method inside it.

```ts
import { MikroORM } from '@mikro-orm/core';
import { CreateRequestContext } from '@mikro-orm/decorators/legacy';

@Injectable()
export class MyService {
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  async doSomething() {
    // this will be executed in a separate context
  }
}
```

> info **Note** As the name suggests, this decorator always creates a new context, as opposed to its alternative `@EnsureRequestContext()`, which creates one only if the method isn't already running inside another context.

#### Testing

The `@mikro-orm/nestjs` package exposes a `getRepositoryToken()` function that returns a prepared token based on a given entity, allowing you to mock the repository.

```typescript
import { MikroOrmModule, getRepositoryToken } from '@mikro-orm/nestjs';

@Module({
  providers: [
    PhotoService,
    {
      // or when you have a custom repository: `provide: PhotoRepository`
      provide: getRepositoryToken(Photo),
      useValue: mockedRepository,
    },
  ],
})
export class PhotoModule {}
```

#### Example

A real-world example of NestJS with MikroORM is available in the [nestjs-realworld-example-app](https://github.com/mikro-orm/nestjs-realworld-example-app) repository.
