### SQL (Knex)

##### This chapter applies only to TypeScript

> **Warning** In this article, you'll learn how to create a `DatabaseModule` based on the **Knex** package from scratch using custom providers mechanism. As a consequence, this solution contains a lot of overhead that you can omit using ready to use and available out-of-the-box dedicated `nest-knexjs` package (see [here](https://github.com/Tony133/nestjs-knexjs)).

#### Getting started

To start the adventure with this library we have to install all required dependencies:

```bash
$ npm install --save knex mysql
```

The first step we need to do is create a **Knex** instance with an options object passed into the constructor, we can also create a [async provider](/fundamentals/async-components).

```typescript
@@filename(database.providers)
import Knex from 'knex';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async () => {
      const knex = Knex({
        client: 'mysql',
        version: '5.7',
        useNullAsDefault: true,
        connection: {
          host: 'localhost',
          port: 3306,
          user: 'root',
          password: 'root',
          database: 'test',
        },
      });
      return await knex;
    },
  },
];
```

> info **Hint** Following best practices, we declared the custom provider in the separated file which has a `*.providers.ts` suffix.

Then, we need to export these providers to make them **accessible** for the rest part of the application.

```typescript
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Now we can inject the `Knex` object using the `@Inject()` decorator. Any class that would depend on the asynchronous provider `Knex` will wait until a `Promise` is resolved.

To do this we need to inject the `DATABASE_CONNECTION` to the `CatsService` using the `@Inject()` decorator like so:

```typescript
@@filename(cats.service)
  import { Inject, Injectable } from '@nestjs/common';
  import { Knex } from 'knex';

  @Injectable()
  export class CatsService {
    constructor(
      @Inject('DATABASE_CONNECTION')
      private readonly knex: Knex,
    ) {}

    async findAll() {
      const cats = await this.knex.table('cats')
      return { cats };
    }
  }
```

#### Migrations

In Knex to define a table in the database we need to create a migration, open terminal and run the following command:

```bash
$ npx knex init
```

A `knexfile.js` file will be created at the root of the project of Nest.

```javascript
  module.exports = {
    development: {
      client: 'mysql',
      connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'root',
        database: 'test',
      },
    },
  }
```

From the terminal we run the following command to create our migrations

```bash
$ npx knex migrate:make cats
```

Once we have created our migration we modify it in this way:

```javascript
  exports.up = function (knex) {
    return knex.schema
      .createTable('cats', function (table) {
        table.increments('id');
        table.integer('age').notNullable();
        table.string('breed', 255).notNullable();
      })
  };

  exports.down = function (knex) {
    return knex.schema.dropTable('cats');
  };
```

Well, now let's run the following command to upload the migrations to the database:

```bash
$ npx knex migrate:latest
```

> info **Hint** For more information on `Knex` see [here](https://knexjs.org/).
