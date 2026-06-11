### Testcontainers


[Testcontainers](https://testcontainers.com/) is an open source framework for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container. Benefits of using Testcontainers than using actual services like databases/message brokers/cloud services are that they are easy to setup, disposable, cheap and most importantly has the same features as those services that you use in your production environment.

> info **Note** This recipe tutorial assumes your container runtime is [Docker](https://www.docker.com/), since it works by default with `Testcontainers` with no minimal setup needed, if you're using another container runtime please refer [here](https://node.testcontainers.org/supported-container-runtimes/) for additional setup.

#### Getting started

In this recipe we'll use [PostgreSQL](https://www.postgresql.org/) as our database, accessed directly via the [node-postgres](https://www.npmjs.com/package/pg) module.

Install the required packages below.

```bash
$ npm install pg 
$ npm install -D @types/pg @testcontainers/postgresql
```

#### Introduction
Before diving into our example, let's first go over how to use Testcontainers in a NestJS application. Essentially, there are two main steps: first, we need to start the necessary services as containers for our tests; second, we must ensure these containers are properly stopped afterward to prevent resource leaks. This is how it would look like.

```typescript
@@filename(cats.service.spec)
import { Test, TestingModule } from '@nestjs/testing';
import { CatsService } from './cats.service';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

const PG_CONTAINER_IMAGE = 'postgres:18.3-alpine';

describe('CatsService', () => {
  let service: CatsService;
  let pgContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // start up our test database container
    pgContainer = await new PostgreSqlContainer(PG_CONTAINER_IMAGE).start(); 
    
    const module: TestingModule = await Test.createTestingModule({
      // (optional) can do a setup/configure here with your database
      providers: [CatsService],
    }).compile();
    service = module.get<CatsService>(CatsService);
    // create tables, insert seed data, etc...
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  afterAll(async () => {
      // close db connections and stop that test database container since we have finish our tests
      await pgContainer.stop();
  });
});
```

In our example above, the `PostgreSqlContainer` class from Testcontainers requires a Docker image as a parameter, allowing you to specify the version or tag of the service required (e.g., `postgres:18.3-alpine`). To avoid potential timeouts during tests, especially with slower network connections, consider downloading/pulling the image beforehand or increasing the [Jest test timeout](https://jestjs.io/docs/api#beforeallfn-timeout). Note that this only affects the initial test run; once the image is downloaded, subsequent tests will run without delay.By default, the `PostgreSqlContainer` above will create a **database** named `test`, and the credentials **username** `test` and **password** `test`, If you want to configure it to be different, we can these methods `withDatabase`, `withUsername` and `withPassword` to modify the default values.

```typescript
pgContainer = await new PostgreSqlContainer()
      .withDatabase('mydb')
      .withUser('root')
      .withPassword('root')
      .start();
```

Now, let's dive into our example. 

#### Main Files Setup
In this example, we will be testing our `CatsService` which has two methods `create` which will insert a cat in the `cats` table and `findAll` which will return all the rows on the `cats` table. 

1. Our DTO object.

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

2. The `DBModule` file is a `DynamicModule`, we're using `forRoot` here so that we can pass a custom configuration by our Postgres test container on our test later.

```typescript
@@filename(db.module)
import { DynamicModule, Module } from '@nestjs/common';
import * as pg from 'pg';

export const DB_SERVICE_TOKEN = 'DB_SERVICE';

@Module({})
export class DbModule {
  static forRoot(options: pg.PoolConfig): DynamicModule {
    return {
      module: DbModule,
      providers: [
        {
          provide: DB_SERVICE_TOKEN,
          useFactory: () => {
            return new pg.Pool(options);
          },
        },
      ],
      exports: [DB_SERVICE_TOKEN],
    };
  }
}
```
3. Next in the `CatsModule` file we import the module `DBModule` that will be accessible inside the `CatsService` file.

> Warning **Warning** **Do not expose these sensitive data publicly**. We have done this for demonstration purposes only. In production you must hide these using environmental variables and use the configuration module and service to retrieve this.

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsService } from './cats.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [
    DbModule.forRoot({
      host: 'localhost',
      user: 'root',
      password: 'root', // these values should be in the .env file 
      port: 5432,
      database: 'test',
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

4. Lastly, our `CatsService` file.

```typescript
@@filename(cats.service)
import * as pg from 'pg';
import { CreateCatDto } from './dto/create-cat.dto';
import { DB_SERVICE_TOKEN } from '../db/db.module';
import { Inject, Injectable } from '@nestjs/common';

interface Cat extends CreateCatDto {
  id: number;
  created_at: string;
}

@Injectable()
export class CatsService {
  constructor(@Inject(DB_SERVICE_TOKEN) private dbService: pg.Pool) {}

  async create(dto: CreateCatDto) {
    const client = await this.dbService.connect();
    try {
      const values = [dto.name, dto.age, dto.breed];
      const {
        rows: [row],
      } = await client.query<Pick<Cat, 'id' | 'created_at'>>({
        text: `INSERT INTO cats(name, age, breed) 
              VALUES($1, $2, $3) RETURNING id, created_at`,
        values,
      });
      return row;
    } finally {
      client.release();
    }
  }

  async findAll() {
    const { rows } = await this.dbService.query<Cat>('SELECT * FROM cats;');
    return rows;
  }
}
```

#### Testing
Notice before that we didn't create our `cats` table, we will do this on our test file.

```typescript
@@filename(cats.service.spec)
import * as pg from 'pg';
import { Test, TestingModule } from '@nestjs/testing';
import { CatsService } from './cats.service';
import { DbModule } from '../db/db.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DB_SERVICE_TOKEN } from '../db/db.module';

const PG_CONTAINER_IMAGE = 'postgres:16.4-alpine';
const TEST_TIMEOUT = 60000;

describe('CatsService', () => {
  let service: CatsService;
  let pgContainer: StartedPostgreSqlContainer;
  let dbService: pg.Pool;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer(PG_CONTAINER_IMAGE).start();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule.forRoot({
          host: pgContainer.getHost(),
          port: pgContainer.getPort(),
          user: pgContainer.getUsername(),
          password: pgContainer.getPassword(),
          database: pgContainer.getDatabase(),
        }),
      ],
      providers: [CatsService],
    }).compile();
    service = module.get<CatsService>(CatsService);
    dbService = module.get<pg.Pool>(DB_SERVICE_TOKEN);
    await dbService.query(`CREATE TABLE IF NOT EXISTS cats (
          id bigserial PRIMARY KEY,
          name varchar  (100) NOT NULL,
          age integer NOT NULL,
          breed varchar(50) NOT NULL,
          created_at timestamp NOT NULL DEFAULT now()
      );`);
  }, TEST_TIMEOUT);

  it('should insert a cat and return its id and timestamp', async () => {
    const cat = await service.create({
      name: 'Garfield',
      age: 44,
      breed: 'Orange Tabby',
    });
    expect(cat.id).toBeDefined();
    expect(cat.created_at).toBeDefined();
  });

  it('should return all the cats', async () => {
    const cats = await service.findAll();
    expect(cats).toHaveLength(1);
  });

  afterAll(async () => {
    await dbService.end();
    await pgContainer.stop();
  }, TEST_TIMEOUT);
});
```

Let's break down this example. We're creating an instance of `PostgreSqlContainer` and calling the `start` method, this will spin up the container on your [Docker](https://www.docker.com/) or other container runtime in the background. The started container `pgContainer` will have data that we can pass on as configuration/options on our module in the `forRoot` specifically for the `DBModule`. Before implementing our tests we need to create our `cats` table which we handled in the `beforeAll` method. We're using `beforeAll` here so that we only create 1 container in our test suite, since if we use `beforeEach` it will create a container per test, but this will also depend on your requirements or use case. Our tests are basic, checking if the `create` method works and also checking if the `findAll` method works and returns the correct number of cats. Lastly, in the `afterAll` is where we cleanup so we don't have resource leaks, first we disconnect from the postgres pool in the `dbService` using the `end` method after that we `stop` the testcontainer `pgContainer`, this will terminate the running `postgres` container in your Docker or other container runtime in the background.

#### More Information

For more information visit the [Testcontainers documentation](https://testcontainers.com/) website.

