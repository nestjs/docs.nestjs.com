### Configuration

Applications often run in different **environments**, and each environment needs its own configuration settings. For example, the local environment typically relies on database credentials that are valid only for the local database instance, while the production environment uses a separate set of credentials. Since configuration variables change between environments, best practice is to [store configuration variables](https://12factor.net/config) in the environment.

Externally defined environment variables are visible inside Node.js through the `process.env` global. You could handle multiple environments by setting the environment variables separately in each one. This quickly gets unwieldy, especially in development and testing environments, where these values need to be easy to mock or change.

In Node.js applications, it's common to represent each environment with a `.env` file that holds key-value pairs. Running an app in a different environment is then a matter of swapping in the correct `.env` file.

A good way to apply this technique in Nest is to create a `ConfigModule` that exposes a `ConfigService`, which loads the appropriate `.env` file. You can write such a module yourself, but for convenience, Nest provides the `@nestjs/config` package. This chapter covers that package.

#### Installation

To get started, install the required dependency:

```bash
$ npm i --save @nestjs/config
```

> info **Hint** The `@nestjs/config` package internally uses [dotenv](https://github.com/motdotla/dotenv).

> warning **Note** `@nestjs/config` requires TypeScript 4.1 or later.

#### Getting started

Once the installation is complete, import the `ConfigModule`. Typically, you import it into the root `AppModule` and control its behavior with the `.forRoot()` static method. During this step, environment variable key/value pairs are parsed and resolved. Later, you'll see several options for accessing the `ConfigService` class of the `ConfigModule` in other feature modules.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

This code loads and parses a `.env` file from the default location (the directory the process is started from, typically the project root), merges the key/value pairs from the `.env` file with the environment variables assigned to `process.env`, and stores the result in a private structure that you can access through the `ConfigService`. The `forRoot()` method registers the `ConfigService` provider, which provides a `get()` method for reading these parsed and merged configuration variables. Since `@nestjs/config` relies on [dotenv](https://github.com/motdotla/dotenv), it uses that package's rules for resolving conflicts in environment variable names. When a key exists both in the runtime environment (e.g., set through a shell export like `export DATABASE_USER=test`) and in a `.env` file, the runtime environment variable takes precedence. To let values from the `.env` file win instead, set the `override` option to `true`.

A sample `.env` file looks like this:

```json
DATABASE_USER=test
DATABASE_PASSWORD=test
```

If you need some environment variables to be available before the `ConfigModule` is loaded and the Nest application is bootstrapped (for example, to pass the microservice configuration to the `NestFactory#createMicroservice()` method), use the `--env-file` option of the Nest CLI. It specifies the path to a `.env` file to load before the application starts. The CLI passes the file to the Node.js `--env-file` flag; see the [Node.js documentation](https://nodejs.org/dist/v20.18.1/docs/api/cli.html#--env-fileconfig) for details.

```bash
$ nest start --env-file .env
```

#### Custom env file path

By default, the package looks for a `.env` file in the current working directory (typically the root directory of the application). To specify another path for the `.env` file, set the `envFilePath` property of the optional options object you pass to `forRoot()`, as follows:

```typescript
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

You can also specify multiple paths for `.env` files:

```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

If a variable is found in multiple files, the first one takes precedence.

#### Disable env variables loading

If you don't want to load the `.env` file and only want to access environment variables from the runtime environment (e.g., set through shell exports like `export DATABASE_USER=test`), set the `ignoreEnvFile` property of the options object to `true`:

```typescript
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

#### Use module globally

To use `ConfigModule` in other modules, you need to import it (as with any Nest module). Alternatively, declare it as a [global module](/modules#global-modules) by setting the `isGlobal` property of the options object to `true`, as shown below. In that case, once `ConfigModule` is loaded in the root module (e.g., `AppModule`), you don't need to import it in other modules.

```typescript
ConfigModule.forRoot({
  isGlobal: true,
});
```

#### Custom configuration files

For more complex projects, you can use custom configuration files that return nested configuration objects. This lets you group related configuration settings by function (e.g., database-related settings) and store them in individual files, so you can manage them independently.

A custom configuration file exports a factory function that returns a configuration object. The configuration object can be any arbitrarily nested plain JavaScript object. Inside the factory, the `process.env` object contains the fully resolved environment variable key/value pairs (with the `.env` file and externally defined variables resolved and merged as described in [Getting started](/application/configuration#getting-started)). Since you control the returned configuration object, you can add any logic you need to cast values to the appropriate type, set default values, and so on. For example:

```typescript
@@filename(config/configuration)
export default () => ({
  port: parseInt(process.env.PORT ?? '', 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '', 10) || 5432
  }
});
```

Load this file with the `load` property of the options object you pass to the `ConfigModule.forRoot()` method:

```typescript
import configuration from './config/configuration.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

> info **Hint** The value assigned to the `load` property is an array, so you can load multiple configuration files (e.g., `load: [databaseConfig, authConfig]`).

Custom configuration files also let you load configuration from other formats, such as YAML. Here is an example of a configuration in YAML format:

```yaml
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
```

To read and parse YAML files, you can use the `js-yaml` package:

```bash
$ npm i js-yaml
$ npm i -D @types/js-yaml
```

Once the package is installed, use the `yaml#load` function to load the YAML file created above:

```typescript
@@filename(config/configuration)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(import.meta.dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
```

> warning **Note** The Nest CLI doesn't automatically copy your "assets" (non-TS files) to the `dist` folder during the build process. To make sure that your YAML files are copied, specify them in the `compilerOptions#assets` object in the `nest-cli.json` file. As an example, if the `config` folder is at the same level as the `src` folder, add `compilerOptions#assets` with the value `"assets": [{{ '{' }}"include": "../config/*.yaml", "outDir": "./dist/config"{{ '}' }}]`. See [Assets](/cli/monorepo#assets) for details.

Configuration files aren't validated automatically, even if you use the `validationSchema` option of the `ConfigModule` (it only applies to environment variables). If you need validation or want to apply transformations, handle them in the factory function, where you have full control over the configuration object.

For example, to ensure that the port is within a certain range, add a validation step to the factory function:

```typescript
@@filename(config/configuration)
export default () => {
  const config = yaml.load(
    readFileSync(join(import.meta.dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;

  if (config.http.port < 1024 || config.http.port > 49151) {
    throw new Error('HTTP port must be between 1024 and 49151');
  }

  return config;
};
```

Now, if the port is outside the specified range, the application throws an error during startup.

<app-banner-devtools></app-banner-devtools>

#### Using the `ConfigService`

To access configuration values, first inject `ConfigService`. As with any provider, you need to import its containing module, the `ConfigModule`, into the module that uses it (unless you set the `isGlobal` property of the options object passed to `ConfigModule.forRoot()` to `true`). Import it into a feature module as shown below:

```typescript
@@filename(feature.module)
@Module({
  imports: [ConfigModule],
  // ...
})
```

Then inject it through the constructor:

```typescript
constructor(private configService: ConfigService) {}
```

> info **Hint** Import `ConfigService` from the `@nestjs/config` package.

Then use it in your class:

```typescript
// get an environment variable
const dbUser = this.configService.get<string>('DATABASE_USER');

// get a custom configuration value
const dbHost = this.configService.get<string>('database.host');
```

As shown above, use the `configService.get()` method to get a simple environment variable by passing the variable name. You can pass a type argument as a TypeScript type hint (e.g., `get<string>(...)`). The `get()` method can also traverse a nested custom configuration object (created with a [custom configuration file](/application/configuration#custom-configuration-files)), as shown in the second example.

You can also get the whole nested custom configuration object using an interface as the type hint:

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
}

const dbConfig = this.configService.get<DatabaseConfig>('database');

// you can now use `dbConfig.port` and `dbConfig.host`
const port = dbConfig.port;
```

The `get()` method also takes an optional second argument that defines a default value, returned when the key doesn't exist:

```typescript
// use "localhost" when "database.host" is not defined
const dbHost = this.configService.get<string>('database.host', 'localhost');
```

If a value is required, use the `getOrThrow()` method instead. It accepts the same arguments as `get()`, but throws an error if the resolved value is `undefined`, and its return type excludes `undefined`:

```typescript
// throws if "DATABASE_USER" is not defined
const dbUser = this.configService.getOrThrow<string>('DATABASE_USER');
```

`ConfigService` has two optional generics (type arguments). The first one helps prevent accessing a configuration property that doesn't exist:

```typescript
interface EnvironmentVariables {
  PORT: number;
  TIMEOUT: string;
}

// somewhere in the code
constructor(private configService: ConfigService<EnvironmentVariables>) {
  const port = this.configService.get('PORT', { infer: true });

  // TypeScript Error: this is invalid as the URL property is not defined in EnvironmentVariables
  const url = this.configService.get('URL', { infer: true });
}
```

With the `infer` property set to `true`, the `ConfigService#get` method infers the property type from the interface. For example, `port` is typed as `number`, since `PORT` has a `number` type in the `EnvironmentVariables` interface (with the `strictNullChecks` compiler option enabled, the type is `number | undefined`).

With the `infer` feature, you can also infer the type of a nested custom configuration object's property, even when using dot notation:

```typescript
constructor(private configService: ConfigService<{ database: { host: string } }>) {
  const dbHost = this.configService.get('database.host', { infer: true })!;
  // typeof dbHost === "string"                                          |
  //                                                                     +--> non-null assertion operator
}
```

The second generic relies on the first one. It acts as a type assertion that removes the `undefined` type that the `ConfigService` methods can return when `strictNullChecks` is enabled. For instance:

```typescript
// ...
constructor(private configService: ConfigService<{ PORT: number }, true>) {
  //                                                               ^^^^
  const port = this.configService.get('PORT', { infer: true });
  //    ^^^ The type of port is 'number', so you don't need TS type assertions
}
```

> info **Hint** To make the `ConfigService#get` method ignore `process.env` variables and retrieve values only from custom configuration files (and from validated environment variables, if you use validation), set the `skipProcessEnv` option to `true` in the options object passed to `ConfigModule.forRoot()`.

#### Configuration namespaces

The `ConfigModule` lets you define and load multiple custom configuration files, as shown in [Custom configuration files](/application/configuration#custom-configuration-files) above. You can manage complex configuration hierarchies with nested configuration objects, as shown in that section. Alternatively, you can return a "namespaced" configuration object with the `registerAs()` function, as follows:

```typescript
@@filename(config/database.config)
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
```

As with custom configuration files, inside your `registerAs()` factory function, the `process.env` object contains the fully resolved environment variable key/value pairs (with the `.env` file and externally defined variables resolved and merged as described in [Getting started](/application/configuration#getting-started)).

> info **Hint** The `registerAs()` function is exported from the `@nestjs/config` package.

Load a namespaced configuration with the `load` property of the `forRoot()` method's options object, in the same way you load a custom configuration file:

```typescript
import databaseConfig from './config/database.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

To get the `host` value from the `database` namespace, use dot notation. Use `'database'` as the prefix of the property name. It corresponds to the name of the namespace (passed as the first argument to the `registerAs()` function):

```typescript
const dbHost = this.configService.get<string>('database.host');
```

Alternatively, you can inject the `database` namespace directly, which gives you strong typing:

```typescript
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

> info **Hint** The `ConfigType` type is exported from the `@nestjs/config` package.

#### Namespaced configurations in modules

To use a namespaced configuration as the configuration object of another module in your application, use the `.asProvider()` method of the configuration object. This method converts your namespaced configuration into a provider definition that you can pass to the `forRootAsync()` method (or equivalent) of the module you want to configure:

```typescript
import databaseConfig from './config/database.config.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(databaseConfig.asProvider()),
  ],
})
```

To understand how the `.asProvider()` method works, look at its return value:

```typescript
// Return value of the .asProvider() method
{
  imports: [ConfigModule.forFeature(databaseConfig)],
  useFactory: (configuration: ConfigType<typeof databaseConfig>) => configuration,
  inject: [databaseConfig.KEY]
}
```

This structure lets you plug namespaced configurations into other modules without writing repetitive boilerplate code, which keeps your application organized and modular.

#### Cache environment variables

Accessing `process.env` can be slow. To improve the performance of the `ConfigService#get` method for variables stored in `process.env`, set the `cache` property of the options object passed to `ConfigModule.forRoot()`:

```typescript
ConfigModule.forRoot({
  cache: true,
});
```

#### Partial registration

So far, we've processed configuration files in the root module (e.g., `AppModule`) with the `forRoot()` method. In a more complex project structure, you may have feature-specific configuration files located in several different directories. Rather than loading all these files in the root module, you can use a feature of the `@nestjs/config` package called **partial registration**, which references only the configuration files associated with each feature module. Use the `forFeature()` static method within a feature module to perform partial registration, as follows:

```typescript
import databaseConfig from './config/database.config.js';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

> warning **Warning** In some circumstances, you may need to access properties loaded through partial registration in the `onModuleInit()` hook rather than in a constructor. This is because the `forFeature()` method runs during module initialization, and the order of module initialization is indeterminate. If you access values loaded this way by another module in a constructor, the module that the configuration depends on may not have initialized yet. The `onModuleInit()` method runs only after all the modules it depends on have been initialized, so this technique is safe.

#### Schema validation

It's standard practice to throw an exception during application startup if required environment variables haven't been provided or don't meet certain validation rules. The `@nestjs/config` package supports two ways to do this:

- A [Standard Schema](https://standardschema.dev/)-compatible schema passed through the `validationSchema` option. Any library that implements the specification works, such as [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), and [ArkType](https://arktype.io/).
- A custom `validate()` function that takes the environment variables as input.

Install the validation library of your choice. This example uses Zod:

```bash
$ npm install --save zod
```

Now define a validation schema and pass it through the `validationSchema` property of the options object passed to `forRoot()`, as shown below:

```typescript
@@filename(app.module)
import { z } from 'zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: z.object({
        NODE_ENV: z
          .enum(['development', 'production', 'test', 'provision'])
          .default('development'),
        PORT: z.coerce.number().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

This schema sets default values for `NODE_ENV` and `PORT`, which are used if you don't provide these variables in the environment (`.env` file or process environment). To require a variable instead, leave it without a default. The validation step then throws an exception during bootstrap if the variable is missing.

Environment variables always arrive as strings, which is why `PORT` uses `z.coerce.number()`. `ConfigService` serves the values returned by the schema, so coercions and transformations declared in the schema apply to the configuration your application reads. Variables that the schema doesn't declare remain available through `ConfigService` as well.

By default, unknown environment variables (the many unrelated entries that `process.env` always carries, such as `PATH` and `HOME`) don't trigger a validation exception, and every failing variable is reported rather than only the first. Each validation error is formatted as `PATH: message`, and the errors are joined by newlines.

You can forward library-specific options through the `validationOptions` key. Because the option is typed against the Standard Schema specification, library-specific settings go under `libraryOptions`:

```typescript
@@filename(app.module)
import { z } from 'zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: z.object({
        NODE_ENV: z
          .enum(['development', 'production', 'test', 'provision'])
          .default('development'),
        PORT: z.coerce.number().default(3000),
      }),
      validationOptions: {
        libraryOptions: {
          // options specific to your validation library
        },
      },
    }),
  ],
})
export class AppModule {}
```

> info **Hint** Joi is still supported, but it requires **Joi v18 or later**, which implements the Standard Schema specification. Pass `Joi.object({{ '{' }} ... &#125;)` to `validationSchema` as before, and put Joi settings such as `allowUnknown` and `abortEarly` under `validationOptions.libraryOptions`. For Joi schemas, `@nestjs/config` keeps its historical defaults of `allowUnknown: true` and `abortEarly: false`, and merges the options you pass on top of them. For new projects, we recommend a modern Standard Schema library such as Zod instead.

> info **Hint** To disable validation of predefined environment variables, set the `validatePredefined` property to `false` in the options object passed to `forRoot()`. Predefined environment variables are process variables (`process.env` variables) that were set before the module was imported. For example, if you start your application with `PORT=3000 node main.js`, then `PORT` is a predefined environment variable.

#### Custom validate function

Alternatively, you can specify a **synchronous** `validate` function. It takes an object containing the environment variables (from the `.env` file and the process) and returns an object containing the validated environment variables, so you can convert or modify them if needed. If the function throws an error, the application doesn't bootstrap.

This example uses the `class-transformer` and `class-validator` packages. First, define:

- a class with validation constraints,
- a validate function that makes use of the `plainToInstance` and `validateSync` functions.

```typescript
@@filename(env.validation)
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

With this in place, pass the `validate` function as a configuration option of the `ConfigModule`:

```typescript
@@filename(app.module)
import { validate } from './env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
```

#### Custom getter functions

`ConfigService` defines a generic `get()` method that retrieves a configuration value by key. You can also add getter functions for a more natural coding style:

```typescript
@@filename()
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
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
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
```

Now you can use the getter function as follows:

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

#### Environment variables loaded hook

If a module configuration depends on environment variables loaded from the `.env` file, use the `ConfigModule.envVariablesLoaded` hook to ensure that the file has been loaded before you read the `process.env` object:

```typescript
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

This construction guarantees that all configuration variables are loaded once the `ConfigModule.envVariablesLoaded` promise resolves.

#### Conditional module configuration

Sometimes you may want to load a module conditionally and specify the condition in an environment variable. The `@nestjs/config` package provides a `ConditionalModule` for this purpose.

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(FooModule, 'USE_FOO'),
  ],
})
export class AppModule {}
```

This module loads the `FooModule` unless the `USE_FOO` environment variable is set to `false` (case-insensitive). If the variable isn't defined, `FooModule` is loaded. You can also pass a custom condition: a function that receives the `process.env` reference and returns a boolean:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    ConditionalModule.registerWhen(
      FooBarModule,
      (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'],
    ),
  ],
})
export class AppModule {}
```

When you use the `ConditionalModule`, make sure the `ConfigModule` is also loaded in the application, so that the `ConfigModule.envVariablesLoaded` hook resolves. If the hook doesn't resolve within 5 seconds (or within the timeout, in milliseconds, set through the `timeout` property of the third `options` argument of the `registerWhen()` method), the `ConditionalModule` throws an error and Nest aborts starting the application.

#### Expandable variables

The `@nestjs/config` package supports environment variable expansion. With this technique, you can create nested environment variables, where one variable is referenced within the definition of another. For example:

```json
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@${APP_URL}
```

With this construction, the variable `SUPPORT_EMAIL` resolves to `'support@mywebsite.com'`. The `${{ '{' }}...{{ '}' }}` syntax triggers resolving the value of the variable `APP_URL` inside the definition of `SUPPORT_EMAIL`.

> info **Hint** For this feature, the `@nestjs/config` package internally uses [dotenv-expand](https://github.com/motdotla/dotenv-expand).

Enable environment variable expansion with the `expandVariables` property of the options object passed to `ConfigModule.forRoot()`, as shown below. Instead of `true`, you can also pass an object with options for `dotenv-expand`.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
```

#### Using in the `main.ts`

Although the configuration is stored in a service, you can still use it in the `main.ts` file, for example, to read variables such as the application port or the CORS host.

To access it, use the `app.get()` method with the service class:

```typescript
const configService = app.get(ConfigService);
```

You can then use it as usual, by calling the `get()` method with the configuration key:

```typescript
const port = configService.get('PORT');
```
