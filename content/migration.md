### Migration guide

This article walks through migrating from NestJS version 11 to version 12. Version 12 is centered around ESM-ready packages, updated CLI defaults, and first-class support for [Standard Schema](https://standardschema.dev/) based validation and serialization. The full release work is tracked in [release: v12.0.0 major release](https://github.com/nestjs/nest/pull/16391).

#### Upgrading packages

Although you can upgrade packages manually, we recommend using [npm-check-updates (ncu)](https://npmjs.com/package/npm-check-updates) for a more streamlined process.

At minimum, update all Nest packages together so that the framework, platform adapters, CLI, and companion packages stay on compatible majors.

```bash
$ npx npm-check-updates '/^@nestjs\//i' -u
$ npm install
```

If you rely on a globally installed CLI binary, update that as well:

```bash
$ npm i -g @nestjs/cli@latest
```

#### ESM packages

All core Nest packages now ship as ESM. For most existing applications this is much less disruptive than it would have been a few years ago, because modern Node.js releases support `require(esm)`.

In practice, this means:

- many existing CommonJS applications will continue to work without a full rewrite
- custom bootstrapping scripts, build tooling, and test runners should be reviewed if they make assumptions about CommonJS-only packages
- if you maintain custom bundler or runtime configuration, make sure it matches the module format your project actually uses

If you are starting a new project, the CLI now lets you choose between a CommonJS and an ESM project layout.

#### New project defaults

`nest new` now prompts you to choose whether to generate a CommonJS or ESM project.

- ESM projects use Vitest by default
- generated projects use oxlint by default

This only changes what the CLI scaffolds for you. Existing projects can keep their current tooling while you migrate on your own schedule.

#### Testing stack

Nest's testing utilities remain the same. The main change is the default stack used by generated ESM projects and by the framework's own repositories and samples: Vitest is now the primary default for ESM workflows.

If your application already uses a different test runner, you do not need to migrate immediately. `@nestjs/testing` remains test-runner agnostic.

When you do decide to migrate:

- update your `test`, `test:watch`, `test:cov`, and `test:e2e` scripts
- review any runner-specific globals and replace them with Vitest equivalents where needed
- check your `supertest` imports in E2E tests if your Vitest setup expects default imports

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
findOne(@Param('id', { schema: userIdSchema }) id: string) {
  return this.usersService.findOne(id);
}
```

On its own, the decorator only attaches schema metadata. To validate against it, register the built-in `StandardSchemaValidationPipe`.

```typescript
app.useGlobalPipes(new StandardSchemaValidationPipe());
```

This is the main schema-first alternative to the traditional `ValidationPipe` plus `class-validator` flow.

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

#### class-validator and class-transformer

The existing decorator-based workflow still works in v12. `ValidationPipe` and `ClassSerializerInterceptor` remain supported and are still a good fit for class-based DTO projects.

Version 12 broadens the built-in options rather than replacing the existing ones:

- use `ValidationPipe` when your DTOs are class-based and rely on decorators
- use `StandardSchemaValidationPipe` when your validation library already exposes a Standard Schema compatible schema
- use `ClassSerializerInterceptor` when your response shaping is based on `class-transformer`
- use `StandardSchemaSerializerInterceptor` when your response shape should be derived from a schema

#### Webpack deprecation in CLI workflows

The v12 release also marks the shift away from webpack-centric CLI workflows. If you have custom webpack-based project generation or build assumptions, plan to migrate those over time. Review any custom builder configuration before upgrading your CLI-driven build pipeline.

#### Other notable release changes

Depending on which Nest packages you use, you may also need to review the following v12 changes called out in the release PR:

- improved pipe transform signatures for stronger type safety
- support for structured logging parameters
- new `errorCode` support in `HttpExceptionOptions`
- NATS v3 support in the microservices package
- gRPC exception filter support in microservices
- regex Kafka pattern support
- request-scoped WebSocket gateways
- route conflict diagnostics and specificity ordering improvements

If you depend on one of these areas, review the corresponding package behavior in your test suite after upgrading.
