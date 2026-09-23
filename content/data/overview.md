### Overview

Nest is database-agnostic, so you can integrate it with any SQL or NoSQL database. At the most basic level, connecting Nest to a database means loading the appropriate Node.js driver for that database, just as you would with [Express](https://expressjs.com/en/guide/database-integration.html) or Fastify, and making the client available to the rest of the application through a [provider](/providers).

Most applications work at a higher level of abstraction, with an ORM or a query builder. The chapters in this category cover the following integrations:

- **[TypeORM](/data/typeorm)** (`@nestjs/typeorm`): an ORM with decorator-based entities and the repository pattern. It supports most SQL databases, as well as MongoDB.
- **[Sequelize](/data/sequelize)** (`@nestjs/sequelize`): a promise-based ORM for SQL databases. With the `sequelize-typescript` package, you declare models with decorators.
- **[Drizzle](/data/drizzle)** (`@nestjs/drizzle`): a lightweight, TypeScript-first ORM. You declare tables with plain functions and write queries with a SQL-like query builder, and Drizzle infers every result type from the schema.
- **[MongoDB](/data/mongodb)** (`@nestjs/mongoose`): [Mongoose](https://mongoosejs.com/) schemas and models for MongoDB.
- **[Prisma](/data/prisma)**: an ORM that generates a type-safe client from a schema file. It has no Nest-specific package: you expose the generated client through a provider.
- **[MikroORM](/data/mikroorm)** (`@mikro-orm/nestjs`, maintained by the MikroORM team): an ORM based on the Data Mapper, Unit of Work, and Identity Map patterns.

The Nest team maintains the `@nestjs/typeorm`, `@nestjs/sequelize`, `@nestjs/drizzle`, and `@nestjs/mongoose` packages. They add Nest-specific features, such as repository or model injection, testability, and asynchronous configuration.

You can also use any other library directly. For example, see how to [build a Nest module for Knex.js](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an). To cache query results, see [Caching](/data/caching).
