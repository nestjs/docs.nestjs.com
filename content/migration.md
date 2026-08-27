### Migration guide

This article walks through migrating from NestJS version 11 to version 12. Version 12 is centered around ESM-ready packages, updated CLI defaults, first-class support for [Standard Schema](https://standardschema.dev/) based validation and serialization, and native [observability](/observability/overview) support. 

#### Upgrading packages

Start by upgrading the Nest CLI itself, since the upgrade command used below ships with it:

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

The command moves every `@nestjs/*` package to its v12-compatible major at once, so the framework, platform adapters, and companion packages stay in sync, and then installs them. On top of that it applies the mechanical parts of the migration described in this guide - `nest-cli.json` webpack options, the GraphQL `playground` / subscriptions transport rename, the NATS package swap, `@nestjs/config` validation options - and prints a report of everything it changed, plus notes on the behavioral changes it cannot migrate for you. Pass `--dry-run` first if you want to see that report without touching your files. See [nest upgrade](/cli/usages#nest-upgrade) for the full list of steps and options.

> info **Hint** `nest upgrade` replaces the manual [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates) flow previously recommended here. You can still upgrade packages manually if you prefer - the important part is that every Nest package moves to the same major at once. Note that the command only bumps the CLI dependency inside your project, which is why the global binary is upgraded first.

#### Node.js requirements

The Node.js requirement differs depending on whether you are **running** an application or **generating** code with the CLI:

| What you are doing | Minimum Node.js |
| --- | --- |
| Running a Nest 12 application | **v20.19+**, or **v22.12+** on the 22.x line |
| `nest new`, `nest generate`, `nest upgrade` (`@nestjs/schematics`) | **v22.22.3+**, **v24.15+**, or **v26+** |

`@nestjs/core` itself still declares `>= 20`, but the v12 packages are ESM-only, and consuming them from a CommonJS application relies on `require(esm)` - which is unflagged only in Node.js 20.19 and 22.12 onwards. The 21.x line never received it and is not supported. `nest upgrade` enforces exactly this and refuses to run on an older release.

The CLI's schematics have a higher floor of their own: `@nestjs/schematics` requires **Node.js v22.22.3+, v24.15+, or v26+**, inherited from the Angular devkit it builds on. Scaffolding and upgrading therefore need a newer runtime than merely running the framework does - and note that the 23.x and 25.x lines, plus early 24.x releases, are excluded.

> info **Hint** The simplest way to satisfy everything is to run the latest active LTS. Pick the bare minimum only if you have a specific reason to stay there - and if you do, note that Node 20.19 is enough to run your application but not to use the CLI's generators.

#### ESM packages

All core Nest packages now ship as ESM. For most existing applications this is much less disruptive than it would have been a few years ago, because modern Node.js releases support `require(esm)`.

> info **Hint** Migrating **your own** application to ESM is entirely optional and **not** part of upgrading to v12. Because Nest's ESM packages can be consumed from CommonJS through `require(esm)`, a CommonJS application can upgrade to v12 and stay CommonJS for as long as you like - `nest upgrade` deliberately leaves your module format alone. Whether you switch is a matter of preference. If and when you decide to, the last two sections of this guide - [Switching your project to ESM](#switching-your-project-to-esm) and [Moving your own code to ESM](#moving-your-own-code-to-esm) - walk you through it.

In practice, this means:

- Many existing CommonJS applications will continue to work without a full rewrite
- Custom bootstrapping scripts, build tooling, and test runners should be reviewed if they make assumptions about CommonJS-only packages
- If you maintain custom bundler or runtime configuration, make sure it matches the module format your project actually uses

If you are starting a new project, the CLI now lets you choose between a CommonJS and an ESM project layout.

#### New project defaults

`nest new` now prompts you to choose whether to generate a CommonJS or ESM project.

- ESM projects use Vitest by default
- Generated projects use oxlint by default

This only changes what the CLI scaffolds for you. Existing projects can keep their current tooling while you migrate on your own schedule.

#### Testing stack

Nest's testing utilities remain the same. The main change is the default stack used by generated ESM projects and by the framework's own repositories and samples: Vitest is now the primary default for ESM workflows.

If your application already uses a different test runner, you do not need to migrate immediately. `@nestjs/testing` remains test-runner agnostic.

When you do decide to migrate:

- Update your `test`, `test:watch`, `test:cov`, and `test:e2e` scripts
- Review any runner-specific globals and replace them with Vitest equivalents where needed
- Check your `supertest` imports in E2E tests if your Vitest setup expects default imports

#### Linting defaults

Newly generated projects use oxlint by default. The migration is only required if you want your repository to match the new CLI scaffolding.

#### Route decorator schemas

Nest adds a new `schema` option to route parameter decorators such as `@Body()`, `@Query()`, `@Param()`, and `@RawBody()`. The schema metadata is designed for [Standard Schema](https://standardschema.dev/) compatible libraries such as Zod, Valibot, ArkType, and others.

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

On its own, the decorator only attaches schema metadata. To validate against it, register the built-in `StandardSchemaValidationPipe`.

```typescript
app.useGlobalPipes(new StandardSchemaValidationPipe());
```

This is a schema-first alternative to the traditional `ValidationPipe` plus `class-validator` flow. The same schemas can also feed OpenAPI generation - see [Standard Schema (Zod, Valibot)](/openapi/introduction#standard-schema-zod-valibot).

The existing decorator-based approach remains fully supported, and there is no plan to remove it. The `schema` attribute is an additional option for teams that prefer schema-first libraries such as Zod.

#### Standard Schema serialization

Nest also introduces `StandardSchemaSerializerInterceptor`, which lets you validate and transform outgoing responses with the same Standard Schema ecosystem.

```typescript
@UseInterceptors(StandardSchemaSerializerInterceptor)
@SerializeOptions({ schema: userResponseSchema })
@Get(':id')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

Use this when you want response shaping to be driven by a schema instead of `class-transformer` decorators.

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

This lets you customize the IDE endpoint and editor behavior while keeping GraphiQL enabled.

#### GraphQL subscriptions transport

The latest `@nestjs/graphql` release removes support for `subscriptions-transport-ws`. Use `graphql-ws` for GraphQL subscriptions moving forward.

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

The microservices package now targets NATS v3, and this upgrade includes a breaking dependency change. If you use the NATS transport, replace the old `nats` package with `@nats-io/transport-node`.

```bash
$ npm uninstall nats
$ npm install @nats-io/transport-node
```

If your application imports NATS helpers directly, update those imports as well. For example, header helpers now come from the new NATS packages:

```typescript
import * as nats from '@nats-io/nats-core';
import { NatsRecordBuilder } from '@nestjs/microservices';

const headers = nats.headers();
headers.set('x-version', '1.0.0');

const record = new NatsRecordBuilder(payload).setHeaders(headers).build();
return this.client.send('record-builder-duplex', record);
```

Also review any custom serializers or deserializers. Nest now serializes NATS packets as JSON strings, and custom NATS deserializers receive the full NATS message object rather than a raw `Uint8Array`. In practice, that means custom deserializers should read the payload from `msg.json()` instead of decoding bytes manually.

#### Lifecycle hook ordering

Lifecycle hooks are now called by component hierarchy level. This can change the execution order of hooks such as `onModuleInit`, `onApplicationBootstrap`, and shutdown hooks when multiple providers or modules depend on one another.

If your application relies on a specific hook ordering between related providers, review that flow during the upgrade and update any assumptions in initialization logic, teardown logic, or tests.

#### class-validator and class-transformer

The existing decorator-based workflow still works in v12. `ValidationPipe` and `ClassSerializerInterceptor` remain supported and are still a good fit for class-based DTO projects.

Version 12 broadens the built-in options rather than replacing the existing ones:

- Use `ValidationPipe` when your DTOs are class-based and rely on decorators
- Use `StandardSchemaValidationPipe` when your validation library already exposes a Standard Schema compatible schema
- Use `ClassSerializerInterceptor` when your response shaping is based on `class-transformer`
- Use `StandardSchemaSerializerInterceptor` when your response shape should be derived from a schema

#### Config module

`@nestjs/config` moves from Joi-specific validation to [Standard Schema](https://standardschema.dev/). The `validationSchema` option now accepts any Standard Schema compatible schema - Zod, Valibot, ArkType, and others.

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

Since validation is no longer tied to a single library, we now recommend a modern Standard Schema library such as Zod for new projects, and the [Configuration chapter](/techniques/configuration#schema-validation) has been rewritten around it.

If you want to keep your existing Joi schemas, they still work, but with two caveats:

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

#### Webpack deprecation in CLI workflows

The v12 release also marks the shift away from webpack-centric CLI workflows. Rspack is now the default bundler for monorepos, and the `--webpack` / `--webpackPath` CLI flags (and their `webpack` / `webpackConfigPath` counterparts in `nest-cli.json`) are deprecated in favor of `--builder rspack`. If you have custom webpack-based project generation or build assumptions, plan to migrate those over time.

The CLI also adds `bun` as a supported package manager, and the `decorator` schematic now generates decorators using the preferred `Reflector.createDecorator()` form. The `angular` schematic has been removed.

#### New CLI commands and flags

The CLI gains a `deploy` command that forwards to [Mau](https://mau.nestjs.com/), installing `@nestjs/mau` as a dev dependency on first use:

```bash
$ nest deploy
```

`nest build` and `nest start` also pick up several new options:

- `--rspackPath [path]` - path to a Rspack configuration file, the counterpart to the deprecated `--webpackPath`
- `--emit-declarations` - emit `.d.ts` files when using the SWC builder (also available as `emitDeclarations` in `nest-cli.json`)
- `--no-type-check` - explicitly disable SWC type checking
- `--silent` - suppress informational compiler logs

`nest build` additionally supports `--parallel [concurrency]`, which builds monorepo projects in parallel when combined with `--all`. `nest-cli.json` also gains an `includeLibraryAssets` property for copying library assets into an application build.

#### Route conflict diagnostics

Nest registers routes in declaration order, which on order-sensitive adapters such as Express means `@Get(':id')` can silently shadow a `@Get('me')` declared after it. v12 adds two **opt-in** options on `NestApplicationOptions` to surface this:

```typescript
const app = await NestFactory.create(AppModule, {
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
  routeResolutionStrategy: 'specificity',
});
```

Both default to the previous behavior, so no existing application changes unless you set them. See the [Controllers chapter](/controllers#route-conflicts-and-resolution-order) for the full description.

#### Machine-readable error codes

`HttpExceptionOptions` accepts a new `errorCode` property, which is serialized into the response body so clients can branch on a stable identifier instead of parsing the message string:

```typescript
throw new BadRequestException('Password is too weak', {
  errorCode: 'WEAK_PASSWORD',
});
```

See the [Exception filters chapter](/exception-filters#machine-readable-error-codes).

#### Structured logging params

`ConsoleLogger` now treats plain objects passed after the message as structured params attached to the same log entry, rather than emitting them as separate records:

```typescript
logger.log('User created', { userId: 1, email: 'foo@bar.com' });
```

In JSON mode they are nested under a `params` key, or spread into the root if you enable `flattenParams`. This behavior is on by default in v12; set `structuredParams: false` to restore the previous behavior. See the [Logger chapter](/techniques/logger#structured-logging-params).

#### Native observability support

Version 12 adds first-class observability support through the official [`@nestjs/observe`](/observability/overview) SDK. Instead of attaching a generic Node.js APM agent to the HTTP server, the SDK plugs into Nest's own request lifecycle through the `instrument` application option, so requests, jobs, errors, and traces are reported in terms of your controllers, providers, resolvers, and queue consumers.

```typescript
export const { ObserveModule, ObserveInstrument } = createObserveModule();

const app = await NestFactory.create(AppModule, {
  instrument: ObserveInstrument,
});
```

There is nothing to migrate here - it is a new, opt-in capability. See the [Observability chapter](/observability/overview) for what auto-instrumentation covers, and the [SDK reference](/observability/sdk) for configuration options.

#### Other notable release changes

Depending on which Nest packages you use, you may also want to review the following:

- **Pipe transform signatures** have been refined for stronger type safety, and `ArgumentMetadata` now takes a generic parameter. Custom pipes with hand-written signatures may need their types adjusted.
- **`ValidationPipe` error format** - a new option lets you control the shape of validation error responses.
- **gRPC exception filter** - `GrpcExceptionFilter` plus a family of status-specific exceptions map errors to proper gRPC status codes instead of `UNKNOWN`. See the [gRPC chapter](/microservices/grpc#exception-handling).
- **Regex Kafka patterns** - `@MessagePattern()` and `@EventPattern()` now accept a `RegExp` on the Kafka transport. See the [Kafka chapter](/microservices/kafka#regular-expression-patterns).
- **Request-scoped WebSocket gateways** - gateways now support request-scoped providers, with the socket injectable via the `REQUEST` token. See the [Gateways chapter](/websockets/gateways#request-scoped-gateways).
- **WebSocket disconnect reason** - `handleDisconnect` can now receive the reason for the disconnection.
- **Microservices pre-request hook** - a new hook runs before a message handler is invoked.
- **Express graceful shutdown** - the Express adapter now drains in-flight requests on shutdown.
- **HTTP adapter error mapping** has been reworked across core, Express, and Fastify adapters.

If you depend on one of these areas, review the corresponding package behavior in your test suite after upgrading.

#### Switching your project to ESM

> warning **Optional** This section and the next one are **not** part of upgrading to v12, which is why they come last. A CommonJS application runs on v12 unchanged - `nest upgrade` will not touch your module format, and nothing in the framework requires you to switch. Read on only if you *want* to move your project to ESM, on whatever schedule suits you.

The switch itself happens in `package.json`, not in `tsconfig.json`. Add a `type` field set to `module`:

```json
{
  "name": "my-app",
  "type": "module"
}
```

That single field is what tells Node.js - and, through `"module": "nodenext"`, TypeScript - to treat your `.js` output as ESM.

Whether you also need to touch `tsconfig.json` depends on how old your project is:

- **Projects generated with the v11 CLI** already use `"module": "nodenext"` and `"moduleResolution": "nodenext"`. Nothing in `tsconfig.json` needs to change - adding `"type": "module"` is enough.
- **Projects generated with v10 or earlier** typically still have `"module": "commonjs"` and no `moduleResolution` entry. Update both before adding `"type": "module"`:

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
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "types": ["vitest/globals", "node"]
  }
}
```

> info **Hint** `nest-cli.json` and `tsconfig.build.json` are identical between the CommonJS and ESM project variants, so neither needs changes. The `types` entry above differs only because ESM projects default to Vitest; a CommonJS project on Jest uses `["node", "jest"]` instead.

> warning **Warning** `"module": "nodenext"` derives the module format of each file from the nearest `package.json`. This means adding `"type": "module"` changes how **every** `.ts` file in the project is emitted, and TypeScript will start reporting the missing import extensions described below. Expect to fix those in the same pass rather than incrementally.

#### Moving your own code to ESM

With the configuration in place, the two things in your own code that most often need attention are relative imports and CommonJS-only globals.

Relative imports must carry a file extension:

```typescript
// Before
import { AppModule } from './app.module';

// After
import { AppModule } from './app.module.js';
```

Note that the extension is `.js` even though the source file is `.ts` - the specifier refers to the emitted file.

`__dirname` and `__filename` do not exist in ESM. Use `import.meta.dirname` instead (or `import.meta.url` with `fileURLToPath` on older Node.js versions):

```typescript
// Before
protoPath: join(__dirname, 'hero/hero.proto'),

// After
protoPath: join(import.meta.dirname, 'hero/hero.proto'),
```

Similarly, `require()` is unavailable. If you need it for interop, construct it explicitly with `createRequire(import.meta.url)` from `node:module`.

> info **Hint** Many code samples throughout these docs use the ESM conventions above. If your project is still CommonJS, drop the `.js` extensions, keep `__dirname`, and call `bootstrap()` without `await`.
