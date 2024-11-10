### Testcontainers


[Testcontainers](https://testcontainers.com/) is an open source framework for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container. Benefits of using Testcontainers than using actual services like databases/message brokers/cloud services are that they are easy to setup, disposable, cheap and most importantly has the same features as those services that you use in your production environment.

> info **Note** This recipe tutorial assumes your container runtime is [Docker](https://www.docker.com/), since it works by default with `Testcontainers` with no minimal setup needed, if you're using another container runtime please refer [here](https://node.testcontainers.org/supported-container-runtimes/) for additional setup.

#### Getting started
In this recipe, we're gonna use [PostgreSQL](https://www.postgresql.org/) for our database and [LocalStack](https://www.localstack.cloud/) a cloud service emulator which can run multiple AWS services locally, specifically we're gonna use [S3](https://aws.amazon.com/s3/) for storing up our images. To start with and for simplicity sake, we will not use any [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping) or **Query Builder** for interacting with our database instead we're gonna use [node-postgres](https://www.npmjs.com/package/pg) module for interacting with a PostgreSQL database.

To get started using Testcontainers with Nestjs, we need to install these  packages below.

```bash
$ npm install pg 
$ npm install i -D @types/pg @types/multer @testcontainers/postgresql @testcontainers/localstack
```

#### Introduction
Before diving into our example, let's first go over how to use Testcontainers in a NestJS application. Essentially, there are two main steps: first, we need to start the necessary services as containers for our tests; second, we must ensure these containers are properly stopped afterward to prevent resource leaks. This is how it would look like

```typescript
@@filename(cats.service.spec.ts)
import { Test, TestingModule } from '@nestjs/testing';
import { CatsService } from './cats.service';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

describe('CatsService', () => {
  let service: CatsService;
  let pgContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // start up our test database container
    pgContainer = await new PostgreSqlContainer().start(); 
    
    const module: TestingModule = await Test.createTestingModule({
      // (optional) can do a setup/configure here with your database
      // e.g create tables, insert seed data, etc...
      providers: [CatsService],
    }).compile();

    service = module.get<CatsService>(CatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  afterAll(async () => {
      // stop that test database container since we have finish our tests
      await pgContainer.stop();
  });
});
```

In our example above, the `PostgreSqlContainer` class from Testcontainers can accept an optional Docker image, allowing you to specify the version or tag of the service required (e.g., `postgres:16.4-alpine`), but by default this will pull the image [`postgres:13.3-alpine`](https://github.com/testcontainers/testcontainers-node/blob/90c537d4054ccda9f69ecf9bbd4e615a2c2e668b/packages/modules/postgresql/src/postgresql-container.ts#L10) locally if this does not exist already. To avoid potential timeouts during tests, especially with slower network connections, consider downloading/pulling the image beforehand or increasing the [Jest test timeout](https://jestjs.io/docs/api#beforeallfn-timeout). Note that this only affects the initial test run; once the image is downloaded, subsequent tests will run without delay.By default, the `PostgreSqlContainer` above will create a **database** named `test`, and the credentials **username** `test` and **password** `test`, If you want to configure it to be different, we can these methods `withDatabase`, `withUsername` and `withPassword` to modify the default values.

```typescript
pgContainer = await new PostgreSqlContainer()
      .withDatabase('mydb')
      .withUser('root')
      .withPassword('root')
      .start();
```

Now, let's dive into our example. 

#### Main Files Setup
In this example, we will be testing our `CatsService` which has two methods `create` which will insert a cat in the `cats` table also optionally will upload the image of that cat if one is provided to S3, and `findAll` which will return all the cats on the `cats` table. 

1. Our DTO object, this is based on the example [here](https://docs.nestjs.com/controllers#request-payloads), but we've added another field `image` in where we store our S3 object's url.

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
  image?: string;
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

3. The `S3Module` same as the `DBModule` has the `forRoot` method so we can pass a custom configuration later.

```typescript
@@filename(s3.module)
import { DynamicModule, Module } from '@nestjs/common';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

export const S3_SERVICE_TOKEN = 'S3_SERVICE';

@Module({})
export class S3Module {
  static forRoot(options: S3ClientConfig): DynamicModule {
    return {
      module: S3Module,
      providers: [
        {
          provide: S3_SERVICE_TOKEN,
          useFactory: () => {
            return new S3Client(options);
          },
        },
      ],
      exports: [S3_SERVICE_TOKEN],
    };
  }
}
```

4. Next in the `CatsModule` file we import those two modules `DBModule` and `S3Module` that contains providers that we will use and will be accessible inside the `CatsService` file.

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsService } from './cats.service';
import { DbModule } from '../db/db.module';
import { S3Module } from '../s3/s3.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DbModule.forRoot({
      host: 'localhost',
      user: 'root',
      password: 'root',
      port: 5432,
      database: 'test',
    }),
    S3Module.forRoot({
      region: 'us-east-1',
    }),
    ConfigModule.forRoot(),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

5. Lastly, our `CatsService` file, this is a little bit complex, since we have the S3 functionality here, it is recommended to put that logic to on the s3 service, but for the purposes of this recipe we will put them in this place.

```typescript
@@filename(cats.service)
import * as pg from 'pg';
import { ConfigService } from '@nestjs/config';
import { CreateCatDto } from './dto/create-cat.dto';
import { DB_SERVICE_TOKEN } from '../db/db.module';
import { S3_SERVICE_TOKEN } from '../s3/s3.module';
import { Inject, Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

interface Cat extends CreateCatDto {
  id: number;
  created_at: string;
}

@Injectable()
export class CatsService {
  constructor(
    @Inject(DB_SERVICE_TOKEN) private dbService: pg.Pool,
    @Inject(S3_SERVICE_TOKEN) private s3Service: S3Client,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateCatDto, file?: Express.Multer.File) {
    const client = await this.dbService.connect();
    try {
      const values = [dto.name, dto.age, dto.breed, null];

      if (file) {
        await this.s3Service.send(
          new PutObjectCommand({
            Bucket: this.configService.get('S3_BUCKET'),
            Body: file.buffer,
            Key: file.originalname,
          }),
        );
        values.pop();
        values.push(file.originalname);
      }
      await client.query('BEGIN');
      const {
        rows: [row],
      } = await client.query<Pick<Cat, 'id' | 'created_at'>>({
        text: `INSERT INTO cats(name, age, breed, image) 
              VALUES($1, $2, $3, $4) RETURNING id, created_at`,
        values,
      });
      await client.query('COMMIT');
      return row;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
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
Notice before that we didn't create our `cats` table or our S3 bucket, we will configure those here on our test file.

> info **Hint** To speed up testing, you can use [Jest + SWC](/recipes/swc#jest--swc) and follow the configuration there.


```typescript
@@filename(cats.service.spec.ts)
import * as fs from 'fs/promises';
import * as path from 'path';
import * as pg from 'pg';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CatsService } from './cats.service';
import { DbModule } from '../db/db.module';
import { S3Module } from '../s3/s3.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
  LocalstackContainer,
  StartedLocalStackContainer,
} from '@testcontainers/localstack';
import {
  S3Client,
  CreateBucketCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { DB_SERVICE_TOKEN } from '../db/db.module';
import { S3_SERVICE_TOKEN } from '../s3/s3.module';

const PG_CONTAINER_IMAGE = 'postgres:16.4-alpine';
const LOCALSTACK_CONTAINER_IMAGE = 'localstack/localstack:stable';
const TEST_TIMEOUT = 60000;

describe('CatsService', () => {
  let service: CatsService;
  let pgContainer: StartedPostgreSqlContainer;
  let localStackContainer: StartedLocalStackContainer;
  let dbService: pg.Pool;
  let s3Service: S3Client;
  let configService: ConfigService;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer(PG_CONTAINER_IMAGE).start();
    localStackContainer = await new LocalstackContainer(
      LOCALSTACK_CONTAINER_IMAGE,
    ).start();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule.forRoot({
          host: pgContainer.getHost(),
          port: pgContainer.getPort(),
          user: pgContainer.getUsername(),
          password: pgContainer.getPassword(),
          database: pgContainer.getDatabase(),
          max: 3,
        }),
        S3Module.forRoot({
          endpoint: localStackContainer.getConnectionUri(),
          forcePathStyle: true,
          region: 'us-east-1',
        }),
        ConfigModule.forRoot(),
      ],
      providers: [CatsService],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) =>
          key === 'S3_BUCKET' ? 'test-containers-cats-bucket' : undefined,
      })
      .compile();

    service = module.get<CatsService>(CatsService);
    configService = module.get<ConfigService>(ConfigService);
    dbService = module.get<pg.Pool>(DB_SERVICE_TOKEN);
    s3Service = module.get<S3Client>(S3_SERVICE_TOKEN);

    await Promise.all([
      dbService.query(`CREATE TABLE IF NOT EXISTS cats (
          id bigserial PRIMARY KEY,
          name varchar  (100) NOT NULL,
          age integer NOT NULL,
          breed varchar(50) NOT NULL,
          image text DEFAULT NULL,
          created_at timestamp NOT NULL DEFAULT now()
      );`),
      s3Service.send(
        new CreateBucketCommand({
          Bucket: configService.get('S3_BUCKET'),
        }),
      ),
    ]);
  }, TEST_TIMEOUT);

  it('should create the cat and saved the provided image on s3 when calling the `create` method', async () => {
    const imageBuffer = await fs.readFile(
      path.join(process.cwd(), 'src/images/garfield_the_cat.png'),
    );
    const garfieldCat = await service.create(
      {
        name: 'Garfield',
        age: 44,
        breed: 'Orange Tabby Cat',
      },
      {
        buffer: imageBuffer,
        size: Buffer.byteLength(imageBuffer),
        originalname: 'garfield_the_cat.png',
        mimetype: 'image/png',
      } as Express.Multer.File,
    );

    const getObjectCmdResult = await s3Service.send(
      new GetObjectCommand({
        Bucket: configService.get('S3_BUCKET'),
        Key: 'garfield_the_cat.png',
      }),
    );

    expect(getObjectCmdResult.$metadata.httpStatusCode).toBe(200);
    expect(garfieldCat.id).toBeDefined();
    expect(garfieldCat.created_at).toBeDefined();
  });

  it('should return all the cats when using `findAll` method', async () => {
    const cats = await service.findAll();
    expect(cats).toHaveLength(1);
  });

  afterAll(async () => {
    await dbService.end();
    await pgContainer.stop();
    await localStackContainer.stop();
  }, TEST_TIMEOUT);
});
```

Let's break down this example. We're creating instances of the testcontainers here the `PostgreSqlContainer` and `LocalstackContainer` and calling the `start` method, this will spin up the containers on your [Docker](https://www.docker.com/) or other container runtime in the background. These started containers `pgContainer` and `localStackContainer` will have data that we can pass on as configuration/options on our modules in the `forRoot` specifically for the `DBModule` and `S3Module`. Before implementing our tests we need to create our `cats` table and our S3 bucket which we handled on the `beforeAll` method also. We're using `beforeAll` here so that we only create 2 containers in our test suite, since if we use `beforeEach` it will create 2 containers per tests, if we use that in our example it will create 4 containers, but this will also depend in your requirements or use case. Our tests are basic, checking if the `create` method works with an image file uploaded and also checking if the `findAll` method works and returns the correct number of cats. Lastly, in the `afterAll` is where we cleanup so we don't have resource leaks, first we disconnect from the postgres pool in the `dbService` after that we stop the testcontainers `pgContainer` and `localStackContainer` this will stop the running containers in your Docker or other container runtime in the background.

#### More Information

For more information visit the [Testcontainers documentation](https://testcontainers.com/) website.

