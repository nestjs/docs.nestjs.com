### TypeORM migration

#### Objectives
Generate and use migrations instead of syncing database. In dev and prod.

#### Pre-requisites
TypeORM installed: https://docs.nestjs.com/techniques/database

#### Install

**src/app.module.ts**
```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as ormconfig from './ormconfig';

export function DatabaseOrmModule(): DynamicModule {
  // we could load the configuration from dotEnv here,
  // but typeORM cli would not be able to find the configuration file.

  return TypeOrmModule.forRoot(ormconfig);
}

@Module({
  imports: [
    TypeOrmModule.forRoot(ormconfig)
    // or
    // DatabaseOrmModule(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```


**src/ormconfig.ts**
```typescript
import {ConnectionOptions} from 'typeorm';

// You can load you .env file here synchronously using dotenv package (not installed here),
// import * as dotenv from 'dotenv';
// import * as fs from 'fs';
// const environment = process.env.NODE_ENV || 'development';
// const data: any = dotenv.parse(fs.readFileSync(`${environment}.env`));
// You can also make a singleton service that load and expose the .env file content.
// ...


// Check typeORM documentation for more information.
const config: ConnectionOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'pwd',
  database: 'migrationexample',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],

  // We are using migrations, synchronize should be set to false.
  synchronize: false,

  // Run migrations automatically,
  // you can disable this if you prefer running migration manually.
  migrationsRun: true,
  logging: true,
  logger: 'file',

  // Allow both start:prod and start:dev to use migrations
  // __dirname is either dist or src folder, meaning either
  // the compiled js in prod or the ts in dev.
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  cli: {
    // Location of migration should be inside src folder
    // to be compiled into dist/ folder.
    migrationsDir: 'src/migrations',
  },
};

export = config;
```


**package.json**
```json
"scripts": {
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js --config src/ormconfig.ts",
    "typeorm:migrate": "npm run typeorm migration:generate -- -n",
    "typeorm:run": "npm run typeorm migration:run"
}
```

#### Usage
1. `npm run typeorm:migrate <myEntity-migration>`
2. Check your migration queries in `src/migrations`.
3. `npm run start:dev` or `npm run start:prod` or `npm run typeorm:run`

If everything went well, you have up to date entites and a `migrations` table listing applied migrations.

#### Additionnal information
- If you set `migrationsRun` to false in ormconfig.ts, you will have to use `npm run typeorm:run` to apply the migration, otherwise all migrations are applied automatically at application start.
- If you do not set `--config` parameter typeorm seek a valid configuration file at the root of the project.
- You do not want `ormconfig.ts` at the root of the project, otherwise it change /dist structure, you would have to change `start:prod: node dist/main.js` to `start:prod: node dist/src/main.js`.

@SeeAlso https://github.com/typeorm/typeorm/blob/master/docs/migrations.md  
@SeeAlso https://github.com/typeorm/typeorm/blob/master/docs/using-cli.md#notes-on-entity-files-written-in-typescript  

#### Working example

A working example is available [here](https://github.com/ambroiseRabier/typeorm-nestjs-migration-example).
