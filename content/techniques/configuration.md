### Configuration

Applications are often run in different **environments**. Depending on the environment, different configuration settings should be used. For example, usually the local environment relies on specific database credentials, valid only for the local DB instance. The production environment would use a separate set of DB credentials. Since configuration variables change, best practice is to [store configuration variables](https://12factor.net/config) in the environment.

Externally defined environment variables are visible inside Node.js through the `process.env` global. We could try to solve the problem of multiple environments by setting the environment variables separately in each environment. This can quickly get unwieldy, especially in the development and testing environments where these values need to be easily mocked and/or changed.

In Node.js applications, it's common to use `.env` files, holding key-value pairs where each key represents a particular value, to represent each environment. Running an app in different environments is then just a matter of swapping in the correct `.env` file.

A good approach for using this technique in Nest is to create a `ConfigModule` that exposes a `ConfigService` which loads the appropriate `.env` file, depending on the `$NODE_ENV` environment variable.

#### Installation

In order to parse our environment files, we'll use the [dotenv](https://github.com/motdotla/dotenv) package.

```bash
$ npm i --save dotenv
$ npm i --save-dev @types/dotenv
```

#### Service

First, we create a `ConfigService` class that will perform the necessary `.env` file parsing and provide an interface for reading configuration variables.

```typescript
@@filename(config/config.service)
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor(filePath: string) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath))
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
@@switch
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  constructor(filePath) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath))
  }

  get(key) {
    return this.envConfig[key];
  }
}
```

This class takes a single argument, a `filePath`, which is a path to your `.env` file. The `get()` method enables access to a private `envConfig` object that holds each property defined in the parsed environment file.

The next step is to create a `ConfigModule`.

```typescript
@@filename()
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  providers: [
    {
      provide: ConfigService,
      useValue: new ConfigService(`${process.env.NODE_ENV || 'development'}.env`),
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
```

The `ConfigModule` registers a `ConfigService` and exports it for visibility in other consuming modules. Additionally, we used the `useValue` syntax (see [Custom providers](/fundamentals/custom-providers)) to pass the path to the `.env` file. This path will be different depending on the actual execution environment as contained in the `NODE_ENV` environment variable (e.g., `'development'`, `'production'`, etc.).

Now you can simply inject `ConfigService` anywhere, and retrieve a particular configuration value based on a passed key.

A sample `development.env` file could look like this:

```typescript
DATABASE_USER = test
DATABASE_PASSWORD = test
```

#### Using the ConfigService

To access **environment variables** from our `ConfigService`, we first need to inject it. Therefore we need to import the `ConfigModule` into the module that will use it.

```typescript
@@filename(app.module)
@Module({
  imports: [ConfigModule],
  ...
})
```

Then we can inject it using standard constructor injection, and use it in our class:

```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { ConfigService } from './config/config.service';

@Injectable()
export class AppService {
  private isAuthEnabled: boolean;
  constructor(config: ConfigService) {
    // Please take note that this check is case sensitive!
    this.isAuthEnabled = config.get('IS_AUTH_ENABLED') === 'true';
  }
}
```

> info **Hint** Instead of importing `ConfigModule` in each module, you can alternatively declare `ConfigModule` as a [global module](https://docs.nestjs.com/modules#global-modules).

#### Advanced configuration

We just implemented a basic `ConfigService`. However, this simple version has a couple of disadvantages, which we'll address now:

- missing names & types for the environment variables (no IntelliSense)
- no validation of the provided `.env` file
- the service treat a `boolean` value as a `string` (`'true'`), so we subsequently have to cast them to `boolean` after retrieving them

#### Validation

We'll start with validation of the provided environment variables. A good technique is to throw an exception if required environment variables haven't been provided or if they don't meet certain validation rules. For this purpose, we are going to use the [Joi](https://github.com/hapijs/joi) npm package. With Joi, you define an object schema and validate JavaScript objects against it.

Install Joi (and its types, for **TypeScript** users):

```bash
$ npm install --save @hapi/joi
$ npm install --save-dev @types/hapi__joi
```

Now we can utilize Joi validation features in our `ConfigService`.

```typescript
@@filename(config.service)
import * as dotenv from 'dotenv';
import * as Joi from '@hapi/joi';
import * as fs from 'fs';

export type EnvConfig = Record<string, string>;

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
      PORT: Joi.number().default(3000),
      API_AUTH_ENABLED: Joi.boolean().required(),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }
}
```

Since we set default values for `NODE_ENV` and `PORT` the validation will not fail if we don't provide these variables in the environment file. Conversely, because there's no default value, our `env` file needs to explicitly provide `API_AUTH_ENABLED`. The validation step will also throw an exception if we have variables in our `.env` file which aren't part of the schema. Finally, Joi tries to convert the string values from the `.env` file into the right type, solving our "booleans as strings" problem from above.

#### Custom getter functions

We already defined a generic `get()` method to retrieve a configuration value by key. We may also add `getter` functions to enable a little more natural coding style:

```typescript
@@filename(config.service)
get isApiAuthEnabled(): boolean {
  return Boolean(this.envConfig.API_AUTH_ENABLED);
}
```

Now we can use the getter function as follows:

```typescript
@@filename(app.service)
@Injectable()
export class AppService {
  constructor(config: ConfigService) {
    if (config.isApiAuthEnabled) {
      // Authorization is enabled
    }
  }
}
```
