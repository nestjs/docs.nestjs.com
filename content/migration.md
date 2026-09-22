### Migration guide

This article walks you through migrating from NestJS version 11 to version 12. Version 12 centers on ESM packages, updated CLI defaults, first-class support for [Standard Schema](https://standardschema.dev/)-based validation and serialization, and native [observability](/observability/overview) support.

#### Upgrading packages

Start by upgrading the Nest CLI itself, because the upgrade command used below ships with it:

```bash
$ npm i -g @nestjs/cli@latest @nestjs/schematics@latest
```

If your project keeps the CLI as a local dev dependency, update it there as well:

```bash
$ npm i -D @nestjs/cli@latest @nestjs/schematics@latest
```

With the latest CLI in place, run `nest upgrade` from the root of your project:

```bash
$ nest upgrade
```

The command moves every recognized `@nestjs/*` package to its v12-compatible major at once, so the framework, platform adapters, and companion packages stay in sync, and then installs them. It also bumps TypeScript to v6 and applies the mechanical parts of the migration described in this guide (`nest-cli.json` webpack options, the GraphQL `playground` and subscriptions transport changes, the NATS package swap, and `@nestjs/config` validation options). Finally, it prints a report of everything it changed, plus notes on the behavioral changes it can't migrate for you. To see that report without touching your files, run the command with `--dry-run` first. See [nest upgrade](/cli/usages#nest-upgrade) for the full list of steps and options.

> info **Hint** `nest upgrade` replaces the manual [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates) flow previously recommended here. You can still upgrade packages manually if you prefer; what matters is that every Nest package moves to the same major at once. The command only bumps the CLI dependency inside your project, which is why you upgrade the global binary first.

#### Node.js requirements

The Node.js requirement differs depending on whether you are **running** an application or **generating** code with the CLI:

| What you are doing | Minimum Node.js |
| --- | --- |
| Running a Nest 12 application | **v20.19+**, or **v22.12+** on the 22.x line |
| `nest new`, `nest generate`, `nest upgrade` (`@nestjs/schematics`) | **v22.22.3+**, **v24.15+**, or **v26+** |

`@nestjs/core` itself still declares `>= 20`, but the v12 packages are ESM-only, and consuming them from a CommonJS application relies on `require(esm)`, which is unflagged only from Node.js 20.19 and 22.12 onwards. The 21.x line never received it and is not supported. `nest upgrade` enforces exactly this and refuses to run on an older release.

AWS Lambda disables `require(esm)` by default on its Node.js 20, 22, and 24 runtimes, even when the corresponding upstream Node.js release enables it. To run a CommonJS Nest 12 application on these Lambda runtimes, enable it through the function's `NODE_OPTIONS` environment variable:

```text
NODE_OPTIONS=--experimental-require-module
```

If `NODE_OPTIONS` already contains other flags, append this flag to the existing value. See the [AWS Lambda documentation](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html#nodejs-experimental) for details and for the support limitations of experimental features.

The CLI's schematics have a higher floor of their own: `@nestjs/schematics` requires **Node.js v22.22.3+, v24.15+, or v26+**, inherited from the Angular devkit it builds on. Scaffolding and upgrading therefore need a newer runtime than running the framework does. The 23.x and 25.x lines, as well as earlier 22.x and 24.x releases, are excluded.

> info **Hint** The simplest way to satisfy every requirement is to run the latest active LTS release. Pick the bare minimum only if you have a specific reason to stay there. If you do, keep in mind that Node.js 20.19 is enough to run your application, but not to use the CLI's generators.

#### ESM packages

All core Nest packages now ship as ESM. For most existing applications, this is much less disruptive than it would have been a few years ago, because modern Node.js releases support `require(esm)`.

> info **Hint** Migrating **your own** application to ESM is entirely optional and **not** part of upgrading to v12. Because Nest's ESM packages can be consumed from CommonJS through `require(esm)`, a CommonJS application can upgrade to v12 and stay CommonJS for as long as you like; `nest upgrade` deliberately leaves your module format alone. Whether you switch is a matter of preference. If you decide to, the last two sections of this guide, [Switching your project to ESM](#switching-your-project-to-esm) and [Moving your own code to ESM](#moving-your-own-code-to-esm), walk you through it.

In practice, this means:

- Many existing CommonJS applications continue to work without a full rewrite
- Review custom bootstrapping scripts, build tooling, and test runners if they make assumptions about CommonJS-only packages
- If you maintain a custom bundler or runtime configuration, make sure it matches the module format your project actually uses

For new projects, the CLI now lets you choose between a CommonJS and an ESM project layout.

#### New project defaults

`nest new` now prompts you to choose whether to generate a CommonJS or an ESM project.

- ESM projects use Vitest by default (CommonJS projects use Jest)
- All generated projects use oxlint by default

This only changes what the CLI scaffolds for you. Existing projects can keep their current tooling and migrate on their own schedule.

#### Testing stack

Nest's testing utilities remain the same. The main change is the default stack used by generated ESM projects and by the framework's own repositories and samples: Vitest is now the primary default for ESM workflows.

If your application already uses a different test runner, you don't need to migrate immediately. `@nestjs/testing` remains test-runner agnostic.

> warning **Warning** If you stay on Jest, note that it can load the ESM-only v12 packages only on Node.js v24.9 or later (older versions fail with `ERR_REQUIRE_ASYNC_MODULE`). Run your test suite on Node.js v24.9+, or consider migrating to Vitest. `nest upgrade` bumps Jest to v30 and warns about this.

When you do decide to migrate:

- Update your `test`, `test:watch`, `test:cov`, and `test:e2e` scripts
- Review any runner-specific globals and replace them with Vitest equivalents where needed
- Check your `supertest` imports in E2E tests if your Vitest setup expects default imports

#### Linting defaults

Newly generated projects use oxlint by default. You only need to migrate if you want your repository to match the new CLI scaffolding.

#### Route decorator schemas

Nest adds a new `schema` option to route parameter decorators such as `@Body()`, `@Query()`, `@Param()`, and `@RawBody()`. The schema metadata is designed for [Standard Schema](https://standardschema.dev/)-compatible libraries such as Zod, Valibot, and ArkType.

For example:

```typescript
@Post()
create(@Body({ schema: createUserSchema }) body: CreateUserDto) {
  return this.usersService.create(body);
}

@Get(':id')
findOne(@Param('id', { schema: z.coerce.number().int().positive() }) id: number) {
  return this.usersService.findOne(id);
}
```

On its own, the decorator only attaches schema metadata. To validate against it, register the built-in `StandardSchemaValidationPipe`:

```typescript
app.useGlobalPipes(new StandardSchemaValidationPipe());
```

This is a schema-first alternative to the traditional `ValidationPipe` plus `class-validator` flow. The same schemas can also feed OpenAPI generation (see [Standard Schema (Zod, Valibot)](/openapi/introduction#standard-schema-zod-valibot)).

The existing decorator-based approach remains fully supported, and there are no plans to remove it. The `schema` option is an additional choice for teams that prefer schema-first libraries such as Zod.

#### Standard Schema serialization

Nest also introduces `StandardSchemaSerializerInterceptor`, which validates and transforms outgoing responses with the same Standard Schema ecosystem.

```typescript
@UseInterceptors(StandardSchemaSerializerInterceptor)
@SerializeOptions({ schema: userResponseSchema })
@Get(':id')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

Use it when you want a schema, instead of `class-transformer` decorators, to drive response shaping.

#### GraphQL IDE configuration

GraphiQL is now the default GraphQL IDE. If you need to customize it, pass a `graphiql` options object instead of setting `graphiql: true`.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  graphiql: {
    url: '/graphql',
    headers: {
      authorization: 'Bearer <token>',
    },
    shouldPersistHeaders: true,
    isHeadersEditorEnabled: true,
  },
});
```

This customizes the IDE endpoint and editor behavior while keeping GraphiQL enabled.

#### GraphQL subscriptions transport

The latest `@nestjs/graphql` release removes support for `subscriptions-transport-ws`. Use `graphql-ws` for GraphQL subscriptions instead.

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  subscriptions: {
    'graphql-ws': true,
  },
});
```

If your application still depends on `subscriptions-transport-ws`, plan that migration as part of your GraphQL package upgrade.

#### NATS v3

The microservices package now targets NATS v3, which includes a breaking dependency change. If you use the NATS transport, replace the old `nats` package with `@nats-io/transport-node`:

```bash
$ npm uninstall nats
$ npm install @nats-io/transport-node
```

If your application imports NATS helpers directly, install `@nats-io/nats-core` as well and update those imports. NATS v3 also dropped the `StringCodec` and `JSONCodec` helpers. For example, the `headers()` helper now comes from `@nats-io/nats-core`:

```typescript
import * as nats from '@nats-io/nats-core';
import { NatsRecordBuilder } from '@nestjs/microservices';

const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(payload).setHeaders(headers).build();
return this.client.send('record-builder-duplex', record);
```

Also review any custom serializers or deserializers. Nest now serializes NATS packets as JSON strings, and custom NATS deserializers receive the full NATS message object instead of a raw `Uint8Array`. In practice, custom deserializers should read the payload with `msg.json()` instead of decoding bytes manually.

#### Lifecycle hook ordering

Lifecycle hooks are now called by component hierarchy level. This can change the execution order of hooks such as `onModuleInit`, `onApplicationBootstrap`, and the shutdown hooks when multiple providers or modules depend on one another.

If your application relies on a specific hook order between related providers, review that flow during the upgrade and update any assumptions in initialization logic, teardown logic, or tests.

#### `@Optional()` is no longer inherited

Nest now reads the optional markers of constructor parameters with `Reflect.getOwnMetadata`, so a subclass no longer inherits the markers its parent declared. Parameter types are still inherited. As a result, a subclass without its own constructor keeps its parent's parameters but loses their optional status, and Nest throws `UnknownDependenciesException` where v11 resolved the parameter as `undefined`.

This is deliberate: a dependency that was genuinely missing used to resolve to `undefined` silently. Give the subclass its own constructor and declare the marker again:

```typescript
@Injectable()
class Child extends Base {
  constructor(@Optional() options?: Options) {
    super(options);
  }
}
```

#### class-validator and class-transformer

The existing decorator-based workflow still works in v12. `ValidationPipe` and `ClassSerializerInterceptor` remain supported and are still a good fit for class-based DTO projects.

Version 12 broadens the built-in options rather than replacing the existing ones:

- Use `ValidationPipe` when your DTOs are class-based and rely on decorators
- Use `StandardSchemaValidationPipe` when your validation library already exposes a Standard Schema-compatible schema
- Use `ClassSerializerInterceptor` when your response shaping is based on `class-transformer`
- Use `StandardSchemaSerializerInterceptor` when your response shape should be derived from a schema

#### Config module

`@nestjs/config` moves from Joi-specific validation to [Standard Schema](https://standardschema.dev/). The `validationSchema` option now accepts any Standard Schema-compatible schema, such as Zod, Valibot, or ArkType.

```typescript
import { z } from 'zod';

ConfigModule.forRoot({
  validationSchema: z.object({
    NODE_ENV: z
      .enum(['development', 'production', 'test', 'provision'])
      .default('development'),
    PORT: z.coerce.number().default(3000),
  }),
});
```

Because validation is no longer tied to a single library, we now recommend a modern Standard Schema library such as Zod for new projects, and the [Configuration chapter](/application/configuration#schema-validation) has been rewritten around it.

Your existing Joi schemas still work, with two caveats:

- You must upgrade to **Joi v18 or later**, which implements the Standard Schema specification
- Library-specific settings previously passed directly under `validationOptions` now go under `validationOptions.libraryOptions`

```typescript
// Before
validationOptions: {
  allowUnknown: false,
  abortEarly: true,
},

// After
validationOptions: {
  libraryOptions: {
    allowUnknown: false,
    abortEarly: true,
  },
},
```

For Joi schemas, `@nestjs/config` keeps its historical defaults of `allowUnknown: true` and `abortEarly: false`, and merges anything you pass on top of them.

#### Terminus module

The legacy health indicator API, deprecated in version 11, has been removed. If your custom health indicators still extend `HealthIndicator` or throw a `HealthCheckError`, migrate them to `HealthIndicatorService`.

**Previous Approach**

Before version 12, a custom health indicator could report an unhealthy state by throwing a `HealthCheckError`:

```typescript
@Injectable()
export class DogHealthIndicator extends HealthIndicator {
  constructor(private readonly dogService: DogService) {
    super();
  }

  async isHealthy(key: string) {
    const badboys = await this.dogService.getBadboys();
    const isHealthy = badboys.length === 0;
    const result = this.getStatus(key, isHealthy, { badboys: badboys.length });

    if (!isHealthy) {
      throw new HealthCheckError('Dog check failed', result);
    }

    return result;
  }
}
```

**Updated Approach (NestJS Terminus v12)**

In version 12, the health indicator returns its result in both cases. Throwing is no longer a way to report an unhealthy state. The indicator either returns `up()` / `down()` explicitly, or hands the operation to `attempt()`, which marks the indicator as `'down'` when the operation throws:

```typescript
@Injectable()
export class DogHealthIndicator {
  constructor(
    private readonly dogService: DogService,
    // Inject the `HealthIndicatorService` provided by the `TerminusModule`
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    const badboys = await this.dogService.getBadboys();

    if (badboys.length > 0) {
      // Mark the indicator as "down" and add additional info to the response
      return indicator.down({ badboys: badboys.length });
    }

    // Mark the health indicator as "up"
    return indicator.up();
  }
}
```

If the indicator only needs to know whether an operation succeeded (e.g., that the dog service is reachable), `attempt()` is the shorter form:

```typescript
isHealthy(key: string) {
  return this.healthIndicatorService
    .check(key)
    .attempt(() => this.dogService.ping())
    .withTimeout(1000);
}
```

The `timeout` option of the built-in database, microservice, and gRPC indicators (e.g., `db.pingCheck('database', {{ '{' }} timeout: 1500 {{ '}' }})`) is deprecated. Chain `.withTimeout(1500)` on the returned attempt instead. See the [Terminus chapter](/recipes/terminus#timeouts-and-caching) for details.

#### Webpack deprecation in CLI workflows

The v12 release also marks the shift away from webpack-centric CLI workflows. Rspack is now the default bundler for monorepos, and the `--webpack` / `--webpackPath` CLI flags (and their `webpack` / `webpackConfigPath` counterparts in `nest-cli.json`) are deprecated in favor of `--builder rspack`. If your project generation or build setup relies on webpack, plan to migrate it over time.

The CLI also adds `bun` as a supported package manager, and the `decorator` schematic now generates decorators in the `Reflector.createDecorator()` form. The `angular` schematic has been removed.

#### New CLI commands and flags

The CLI gains a `deploy` command that forwards to [Mau](https://mau.nestjs.com/), installing `@nestjs/mau` as a dev dependency on first use:

```bash
$ nest deploy
```

`nest build` and `nest start` also pick up several new options:

- `--rspackPath [path]`: path to a Rspack configuration file, the counterpart to the deprecated `--webpackPath`
- `--emit-declarations`: emit `.d.ts` files when using the SWC builder (also available as `emitDeclarations` in `nest-cli.json`)
- `--no-type-check`: explicitly disable SWC type checking
- `--silent`: suppress informational compiler logs

`nest build` also supports `--parallel [concurrency]`, which builds monorepo projects in parallel when combined with `--all`. In addition, `nest-cli.json` gains an `includeLibraryAssets` property for copying library assets into an application build.

#### Route conflict diagnostics

Nest registers routes in declaration order. On order-sensitive adapters such as Express, this means `@Get(':id')` can silently shadow a `@Get('me')` declared after it. v12 adds two **opt-in** options to `NestApplicationOptions` to address this:

```typescript
const app = await NestFactory.create(AppModule, {
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
  routeResolutionStrategy: 'specificity',
});
```

Both default to the previous behavior, so existing applications are unaffected unless you set them. See the [Controllers chapter](/controllers#route-conflicts-and-resolution-order) for the full description.

#### Machine-readable error codes

`HttpExceptionOptions` accepts a new `errorCode` property. It is serialized into the response body, so clients can branch on a stable identifier instead of parsing the message string:

```typescript
throw new BadRequestException('Password is too weak', {
  errorCode: 'WEAK_PASSWORD',
});
```

See [Machine-readable error codes](/exception-filters#machine-readable-error-codes) in the Exception filters chapter.

#### Structured logging params

`ConsoleLogger` now treats plain objects passed after the message as structured params attached to the same log entry, instead of emitting them as separate records:

```typescript
logger.log('User created', { userId: 1, email: 'foo@bar.com' });
```

In JSON mode, they are nested under a `params` key, or spread into the root object if you enable `flattenParams`. This behavior is on by default in v12; set `structuredParams: false` to restore the previous behavior. See [Structured logging params](/application/logger#structured-logging-params) in the Logger chapter.

#### Native observability support

Version 12 adds first-class observability support through the official [`@nestjs/observe`](/observability/overview) SDK. Instead of attaching a generic Node.js APM agent to the HTTP server, the SDK plugs into Nest's own request lifecycle through the `instrument` application option. As a result, requests, jobs, errors, and traces are reported in terms of your controllers, providers, resolvers, and queue consumers.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ObserveModule.forRoot({ serviceId: 'cats-app' })],
})
export class AppModule {}
```

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

const app = await NestFactory.create(AppModule, {
  instrument: ObserveInstrument,
});
```

There is nothing to migrate here: it is a new, opt-in capability. See the [Observability chapter](/observability/overview) for what auto-instrumentation covers, and the [SDK reference](/observability/sdk) for configuration options.

#### Other notable release changes

Depending on which Nest packages you use, you may also want to review the following changes:

- **Pipe transform signatures** have been refined for stronger type safety, and `ArgumentMetadata` now takes a generic parameter. Custom pipes with hand-written signatures may need their types adjusted.
- **`ValidationPipe` error format**: the new `errorFormat` option (`'list'` or `'grouped'`) controls the shape of validation error responses.
- **gRPC exception filter**: `GrpcExceptionFilter`, plus a family of status-specific exceptions, maps errors to the proper gRPC status codes instead of `UNKNOWN`. See the [gRPC chapter](/microservices/grpc#exception-handling).
- **Regex Kafka patterns**: `@MessagePattern()` and `@EventPattern()` now accept a `RegExp` on the Kafka transport. See the [Kafka chapter](/microservices/kafka#regular-expression-patterns).
- **Request-scoped WebSocket gateways**: gateways now support request-scoped providers, with the socket injectable through the `REQUEST` token. See the [Gateways chapter](/websockets/gateways#request-scoped-gateways).
- **WebSocket disconnect reason**: `handleDisconnect` can now receive the reason for the disconnection.
- **Microservices pre-request hook**: a new hook runs before a message handler is invoked.
- **Express graceful shutdown**: the Express adapter now drains in-flight requests on shutdown.
- **HTTP adapter error mapping** has been reworked across the core, Express, and Fastify adapters.

If you depend on one of these areas, verify the corresponding behavior with your test suite after upgrading.

#### Switching your project to ESM

> warning **Optional** This section and the next one are **not** part of upgrading to v12, which is why they come last. A CommonJS application runs on v12 unchanged: `nest upgrade` doesn't touch your module format, and nothing in the framework requires you to switch. Read on only if you *want* to move your project to ESM, on whatever schedule suits you.

The switch itself happens in `package.json`, not in `tsconfig.json`. Add a `type` field set to `module`:

```json
{
  "name": "my-app",
  "type": "module"
}
```

That single field tells Node.js (and, through `"module": "nodenext"`, TypeScript) to treat your `.js` output as ESM.

Whether you also need to change `tsconfig.json` depends on how old your project is:

- **Projects generated with a recent v11 CLI** (`@nestjs/schematics` 11.0.6 or later) already use `"module": "nodenext"` and `"moduleResolution": "nodenext"`. Nothing in `tsconfig.json` needs to change; adding `"type": "module"` is enough.
- **Projects generated with earlier releases** (v10, or early v11) typically still have `"module": "commonjs"` and no `moduleResolution` entry. Update both before adding `"type": "module"`:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "target": "ES2023"
  }
}
```

For reference, this is the complete `compilerOptions` set used by the ESM project that `nest new` generates:

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": ".",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "types": ["vitest/globals", "node"]
  }
}
```

> info **Hint** `nest-cli.json` and `tsconfig.build.json` are identical in the CommonJS and ESM project variants, so neither needs changes. The `types` entry above differs only because ESM projects default to Vitest; a CommonJS project on Jest uses `["node", "jest"]` instead.

> warning **Warning** `"module": "nodenext"` derives the module format of each file from the nearest `package.json`. Adding `"type": "module"` therefore changes how **every** `.ts` file in the project is emitted, and TypeScript starts reporting the missing import extensions described below. Expect to fix them in the same pass rather than incrementally.

#### Moving your own code to ESM

With the configuration in place, the two things in your own code that most often need attention are relative imports and CommonJS-only globals.

Relative imports must carry a file extension:

```typescript
// Before
import { AppModule } from './app.module';

// After
import { AppModule } from './app.module.js';
```

The extension is `.js` even though the source file is `.ts`, because the specifier refers to the emitted file.

`__dirname` and `__filename` do not exist in ESM. Use `import.meta.dirname` instead (or `import.meta.url` with `fileURLToPath` on older Node.js versions):

```typescript
// Before
protoPath: join(__dirname, 'hero/hero.proto'),

// After
protoPath: join(import.meta.dirname, 'hero/hero.proto'),
```

Similarly, `require()` is unavailable. If you need it for interop, create it explicitly with `createRequire(import.meta.url)` from `node:module`.

> info **Hint** Many code samples throughout these docs use the ESM conventions above. If your project is still CommonJS, drop the `.js` extensions, keep `__dirname`, and call `bootstrap()` without `await`.
