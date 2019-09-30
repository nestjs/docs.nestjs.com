### Database

Nest is database agnostic, allowing you to easily integrate with any SQL or NoSQL database. You have a number of options available to you, depending on your preferences. At the most general level, connecting Nest to a database is simply a matter of loading an appropriate Node.js driver for the database, just as you would with [Express](https://expressjs.com/en/guide/database-integration.html) or Fastify.

You can also directly use any general purpose Node.js database integration **library** or ORM, such as [Sequelize](https://sequelize.org/) ([recipe](https://docs.nestjs.com/recipes/sql-sequelize)), [Knex.js](http://knexjs.org/) ([tutorial](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an)) and [TypeORM](https://github.com/typeorm/typeorm), to operate at a higher level of abstraction.

For convenience, Nest also provides tight integration with TypeORM out-of-the box with `@nestjs/typeorm`, which we'll cover in the current chapter, and Mongoose with `@nestjs/mongoose`, which is covered in [this chapter](/techniques/mongodb). These integrations provide additional NestJS-specific features, such as model/repository injection, testability, and asynchronous configuration to make accessing your chosen database even easier.

### TypeORM Integration

For integrating with SQL and NoSQL databases, Nest provides the `@nestjs/typeorm` package. Nest uses [TypeORM](https://github.com/typeorm/typeorm) because it's the most mature Object Relational Mapper (ORM) available for TypeScript. Since it's written in TypeScript, it integrates well with the Nest framework.

To begin using it, we first install the required dependencies. In this chapter, we'll demonstrate using the popular [MySQL](https://www.mysql.com/) Relational DBMS, but TypeORM provides support for many relational databases, such as PostgreSQL, Oracle, Microsoft SQL Server, SQLite, and even NoSQL databases like MongoDB. The procedure we walk through in this chapter will be the same for any database supported by TypeORM. You'll simply need to install the associated client API libraries for your selected database.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql
```

Once the installation process is complete, we can import the `TypeOrmModule` into the root `AppModule`.

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

The `forRoot()` method accepts the same configuration object as `createConnection()` from the [TypeORM](https://typeorm.io/#/connection-options) package. Alternatively, rather than passing a configuration object to `forRoot()`, we can create an `ormconfig.json` file in the project root directory.

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "root",
  "database": "test",
  "entities": ["dist/**/*.entity{.ts,.js}"],
  "synchronize": true
}
```

> warning **Warning** Static glob paths (e.g. `dist/**/*.entity{{ '{' }} .ts,.js{{ '}' }}`) won't work properly with [webpack](https://webpack.js.org/).

Then, we can call `forRoot()` without any options:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot()],
})
export class AppModule {}
```

Once this is done, the TypeORM `Connection` and `EntityManager` objects will be available to inject across the entire project (without needing to import any modules), for example:

```typescript
@@filename(app.module)
import { Connection } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), PhotoModule],
})
export class AppModule {
  constructor(private readonly connection: Connection) {}
}
@@switch
import { Connection } from 'typeorm';

@Dependencies(Connection)
@Module({
  imports: [TypeOrmModule.forRoot(), PhotoModule],
})
export class AppModule {
  constructor(connection) {
    this.connection = connection;
  }
}
```

#### Repository pattern

[TypeORM](https://github.com/typeorm/typeorm) supports the repository design pattern, so each entity has its own Repository. These repositories can be obtained from the database connection.

To continue the example, we need at least one entity. We'll use the `Photo` entity from the official TypeORM documentation.

```typescript
@@filename(photo.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}
```

The `Photo` entity belongs to the `photo` directory. This directory represents the `PhotoModule`. It's your decision where to keep your model files. We recommend creating them near their **domain**, in the corresponding module directory.

To begin using `Photo` entity, we need to let TypeORM know about it by inserting it into the `entities` array (unless you use a static glob path):

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo/photo.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [Photo],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Let's have a look at the `PhotoModule` now:

```typescript
@@filename(photo.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { Photo } from './photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}
```

This module uses the `forFeature()` method to define which repositories are registered in the current scope. With that, we can inject the `PhotoRepository` into the `PhotoService` using the `@InjectRepository()` decorator:

```typescript
@@filename(photo.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Photo } from './photo.entity';

@Injectable()
@Dependencies(InjectRepository(Photo))
export class PhotoService {
  constructor(photoRepository) {
    this.photoRepository = photoRepository;
  }

  findAll() {
    return this.photoRepository.find();
  }
}
```

> warning **Notice** Don't forget to import the `PhotoModule` into the root `AppModule`.

If you want to use the repository outside of the module which imports `TypeOrmModule.forFeature`, you'll need to re-export the providers generated by it.
You can do this by exporting the whole module, like this:

```typescript
@@filename(photo.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from './photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  exports: [TypeOrmModule]
})
export class PhotoModule {}
```

Now if we import `PhotoModule` in `PhotoHttpModule`, we can use `@InjectRepository(Photo)` in the providers of the latter module.

```typescript
@@filename(photo-http.module)
import { Module } from '@nestjs/common';
import { PhotoModule } from './photo.module';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';

@Module({
  imports: [PhotoModule],
  providers: [PhotoService],
  controllers: [PhotoController]
})
export class PhotoHttpModule {}
```

#### Multiple databases

Some projects require multiple database connections. This can also be achieved with this module. To work with multiple connections, first create the connections. In this case, connection naming becomes **mandatory**.

Suppose you have a `Person` entity and an `Album` entity, each stored in their own database.

```typescript
const defaultOptions = {
  type: 'postgres',
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
      host: 'photo_db_host',
      entities: [Photo],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'personsConnection',
      host: 'person_db_host',
      entities: [Person],
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

> warning **Notice** If you don't set the `name` for a connection, its name is set to `default`. Please note that you shouldn't have multiple connections without a name, or with the same name, otherwise they will get overridden.

At this point, you have each of your `Photo`, `Person` and `Album` entities registered with their own connection. With this setup, you have to tell the `TypeOrmModule.forFeature()` function and the `@InjectRepository()` decorator which connection should be used. If you do not pass any connection name, the `default` connection is used.

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Photo]),
    TypeOrmModule.forFeature([Person], 'personsConnection'),
    TypeOrmModule.forFeature([Album], 'albumsConnection'),
  ],
})
export class AppModule {}
```

You can also inject the `Connection` or `EntityManager` for a given connection:

```typescript
@Injectable()
export class PersonService {
  constructor(
    @InjectConnection('personsConnection')
    private readonly connection: Connection,
    @InjectEntityManager('personsConnection')
    private readonly entityManager: EntityManager,
  ) {}
}
```

#### Testing

When it comes to unit testing an application, we usually want to avoid making a database connection, keeping our test suites independent and their execution process as fast as possible. But our classes might depend on repositories that are pulled from the connection instance. How do we handle that? The solution is to create mock repositories. In order to achieve that, we set up [custom providers](/fundamentals/custom-providers). Each registered repository is automatically represented by an `<EntityName>Repository` token, where `EntityName` is the name of your entity class.

The `@nestjs/typeorm` package exposes the `getRepositoryToken()` function which returns a prepared token based on a given entity.

```typescript
@Module({
  providers: [
    PhotoService,
    {
      provide: getRepositoryToken(Photo),
      useValue: mockRepository,
    },
  ],
})
export class PhotoModule {}
```

Now a substitute `mockRepository` will be used as the `PhotoRepository`. Whenever any class asks for `PhotoRepository` using an `@InjectRepository()` decorator, Nest will use the registered `mockRepository` object.

#### Custom repository

TypeORM provides a feature called **custom repositories**. Custom repositories allow you to extend a base repository class, and enrich it with several special methods. To learn more about this feature, visit [this page](http://typeorm.io/#/custom-repository).

In order to create your custom repository, use the `@EntityRepository()` decorator and extend the `Repository` class.

```typescript
@EntityRepository(Author)
export class AuthorRepository extends Repository<Author> {}
```

> info **Hint** Both `@EntityRepository()` and `Repository` are imported from the `typeorm` package.

Once the class is created, the next step is to delegate instantiation responsibility to Nest. For this, we have to pass the`AuthorRepository` class to the `TypeOrm.forFeature()` method.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([AuthorRepository])],
  controller: [AuthorController],
  providers: [AuthorService],
})
export class AuthorModule {}
```

Afterward, simply inject the repository using the following construction:

```typescript
@Injectable()
export class AuthorService {
  constructor(private readonly authorRepository: AuthorRepository) {}
}
```

#### Async configuration

You may want to pass your repository module options asynchronously instead of statically. In this case, use the `forRootAsync()` method, which provides several ways to deal with async configuration.

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
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  }),
});
```

Our factory behaves like any other [asynchronous provider](https://docs.nestjs.com/fundamentals/async-providers) (e.g., it can be `async` and it's able to inject dependencies through `inject`).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.getString('HOST'),
    port: configService.getString('PORT'),
    username: configService.getString('USERNAME'),
    password: configService.getString('PASSWORD'),
    database: configService.getString('DATABASE'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
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

The construction above will instantiate `TypeOrmConfigService` inside `TypeOrmModule` and use it to provide an options object by calling `createTypeOrmOptions()`. Note that this means that the `TypeOrmConfigService` has to implement the `TypeOrmOptionsFactory` interface, as shown below:

```typescript
@Injectable()
class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    };
  }
}
```

In order to prevent the creation of `TypeOrmConfigService` inside `TypeOrmModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

This construction works the same as `useClass` with one critical difference - `TypeOrmModule` will lookup imported modules to reuse an existing `ConfigService` instead of instantiating a new one.

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm).
