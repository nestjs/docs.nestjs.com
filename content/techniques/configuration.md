### Configuration

Applications often run in different **environments**. Depending on the environment, different configuration settings should be used. For example, usually the local environment relies on specific database credentials, valid only for the local DB instance. The production environment would use a separate set of DB credentials. Since configuration variables change, best practice is to [store configuration variables](https://12factor.net/config) in the environment.

Externally defined environment variables are visible inside Node.js through the `process.env` global. We could try to solve the problem of multiple environments by setting the environment variables separately in each environment. This can quickly get unwieldy, especially in the development and testing environments where these values need to be easily mocked and/or changed.

In Node.js applications, it's common to use `.env` files, holding key-value pairs where each key represents a particular value, to represent each environment. Running an app in different environments is then just a matter of swapping in the correct `.env` file.

A good approach for using this technique in Nest is to create a `ConfigModule` that exposes a `ConfigService` which loads the appropriate `.env` file, depending on the `$NODE_ENV` environment variable. For convenience, Nest also provides `@nestjs/config` package out-of-the box which we'll cover in the current chapter.

#### Installation

To begin using it, we first install the required dependency.

```bash
$ npm i --save @nestjs/config
```

> info **Hint** The `@nestjs/config` package internally uses [dotenv](https://github.com/motdotla/dotenv).

#### Getting started

Once the installation process is complete, we can import the `ConfigModule` into the root `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

This module will perform the necessary `.env` file parsing and register the `ConfigService` which provides an interface for reading configuration variables. The `ConfigService` defines the `get()` method that enables access to a private object that holds each property defined in the parsed environment file.

A sample `.env` file could look like this:

```json
DATABASE_USER = test
DATABASE_PASSWORD = test
```

#### Custom env file path

By default, the package looks for the `.env` file in the root directory of the application. If you want to specify another path for the `.env`, set the `envFilePath` property as follows:

```typescript
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

#### Disable env variables loading

If you don't want to load `.env` file automatically, set the `ignoreEnvFile` property to `true` as follows:

```typescript
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

#### Use module globally

Instead of importing `ConfigModule` in each module, you can alternatively declare `ConfigModule` as a [global module](https://docs.nestjs.com/modules#global-modules).

```typescript
ConfigModule.forRoot({
  isGlobal: true,
});
```

Now you can simply inject `ConfigService` anywhere, and retrieve a particular configuration value based on a passed key without importing `ConfigModule` beforehand.

#### Custom configuration files

For more complex projects, you may prefer to define multiple configuration files with nested objects to define groups of related configurations (e.g. database configuration related values). Grouping files makes it easier to understand all the configuration needed to setup the project. In addition, they allow you to automatically cast process environment variables to appropriate types (since every `process.env` gives a `string`) and set the default values for specific properties (e.g. fallback to port `3000`).

```typescript
@@filename(config/configuration)
export default {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432
  }
}
```

We can load this file using the `load` property of the `ConfigModule.forRoot()` method:

```typescript
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

> info **Notice** We can load multiple configuration files (e.g. `load: [databaseConfig, authConfig]`).

#### Using the `ConfigService`

To access configuration values from our `ConfigService`, we first need to inject it. Therefore we need to import the `ConfigModule` into the module that will use it, unless you set the `isGlobal` property (in the options object passed into the `ConfigModule.forRoot()` method) to `true`.

```typescript
@@filename(app.module)
@Module({
  imports: [ConfigModule],
  ...
})
```

Then we can inject it using standard constructor injection:

```typescript
constructor(private readonly configService: ConfigService) {}
```

And use it in our class:

```typescript
// get the environment variable
const dbUser = this.configService.get<string>('DATABASE_USER');

// get the custom configuration values
const dbHost = this.configService.get<string>('database.host');
```

As you may noticed, we can use `configService.get()` method to either get a specific environment variable (based on the variable name) or use the dot notation to traverse nested object of our custom configuration file. In addition, we can pass the second argument to define a default value, which will be used when the key doesn't exist.

```typescript
// use "localhost" when "database.host" is not defined
const dbHost = this.configService.get<string>('database.host', 'localhost');
```

#### Configuration namespaces

The `ConfigModule` allows you to define multiple custom configuration files. However, if you define the configuration under the same key (e.g. `host`) in multiple files, they will collide with each other.

To avoid overwriting the configuration keys, you can use `registerAs()` function to define a namespace as follows:

```typescript
@@filename(config/database.config)
export default registerAs('database', {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
});
```

> info **Hint** The `registerAs` function is exported from the `@nestjs/config` package.

Now, to get the `host` value from the `database` namespace, you can use a dot notation:

```typescript
const dbHost = this.configService.get<string>('database.host');
```

Where `database` is the name of the namespace (first argument passed into the `registerAs` function).

#### Partial registration

In more sophisticated scenarios, you may have a complex project structure in which the configuration files are located in multiple, different directories. In order to avoid referencing all these files in the root module (`AppModule`), we can use a technique called **partial registration**. With the partial registration, you can register a configuration within a feature module as follows:

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

#### Schema validation

A good technique is to throw an exception if required environment variables haven't been provided or if they don't meet certain validation rules. For this purpose, we are going to use the [Joi](https://github.com/hapijs/joi) npm package. With Joi, you define an object schema and validate JavaScript objects against it.

Install Joi (and its types, for **TypeScript** users):

```bash
$ npm install --save @hapi/joi
$ npm install --save-dev @types/hapi__joi
```

Now we can define a Joi validation schema.

```typescript
@@filename(config.service)
import * as Joi from '@hapi/joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

Since we set default values for `NODE_ENV` and `PORT` the validation will not fail if we don't provide these variables in the environment file. The validation step will throw an exception if we have variables in our `.env` file which aren't part of the schema. Finally, Joi tries to convert the string values from the `.env` file into the right type.

#### Custom getter functions

`ConfigService` defines a generic `get()` method to retrieve a configuration value by key. We may also add `getter` functions to enable a little more natural coding style:

```typescript
@@filename()
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return Boolean(this.configService.get('AUTH_ENABLED');
  }
}
@@switch
@Dependencies(ConfigService)
@Injectable()
export class ApiConfigService {
  constructor(configService) {
    this.configService = configService;
  }

  get isAuthEnabled() {
    return Boolean(this.configService.get('AUTH_ENABLED');
  }
}
```

Now we can use the getter function as follows:

```typescript
@@filename(app.service)
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
@@switch
@Dependencies(ApiConfigService)
@Injectable()
export class AppService {
  constructor(apiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Authentication is enabled
    }
  }
}
```
