### Validation

Validate every piece of data a web application receives before acting on it. Nest provides several pipes that validate incoming requests automatically:

- `ValidationPipe` validates classes decorated with [class-validator](https://github.com/typestack/class-validator) rules.
- `StandardSchemaValidationPipe` validates schemas written with [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [ArkType](https://arktype.io/), or any other [Standard Schema](https://standardschema.dev/) compatible library.
- `ParseIntPipe`, `ParseBoolPipe`, `ParseArrayPipe`, and `ParseUUIDPipe` validate and convert individual values.

#### Overview

The [Pipes](/pipes) chapter explains how pipes work and how to bind them to parameters, route handlers, controllers, or the whole application. This chapter builds on it and covers real-world use of the two validation pipes.

The pipes differ in where the validation rules live:

- With `ValidationPipe`, rules are decorators on a **DTO class**, and the class is also the parameter's TypeScript type. This approach integrates with the [mapped types](#mapped-types) utilities and with the Swagger CLI plugin.
- With `StandardSchemaValidationPipe`, rules are a **schema object**, and the parameter's TypeScript type is inferred from the schema. Schemas compose with the methods of their library, and no class or reflection metadata is involved.

Both pipes can be registered at the same time. `ValidationPipe` only validates parameters typed with a class, and `StandardSchemaValidationPipe` only validates parameters that declare a schema, so you can adopt schemas incrementally in an existing application.

#### Using the built-in ValidationPipe

To begin using it, first install the required dependencies.

```bash
$ npm i --save class-validator class-transformer
```

> info **Hint** The `ValidationPipe` is exported from the `@nestjs/common` package.

Because this pipe uses the [`class-validator`](https://github.com/typestack/class-validator) and [`class-transformer`](https://github.com/typestack/class-transformer) libraries, it supports many options. Pass them in a configuration object to the pipe's constructor. The pipe's own options are:

```typescript
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
  errorFormat?: 'list' | 'grouped';
}
```

In addition to these, all `class-validator` options (inherited from the `ValidatorOptions` interface) are available:

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>enableDebugMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validator will print extra warning messages to the console when something is not right.</td>
  </tr>
  <tr>
    <td><code>skipUndefinedProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true then validator will skip validation of all properties that are undefined in the validating object.</td>
  </tr>
  <tr>
    <td><code>skipNullProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true then validator will skip validation of all properties that are null in the validating object.</td>
  </tr>
  <tr>
    <td><code>skipMissingProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true then validator will skip validation of all properties that are null or undefined in the validating object.</td>
  </tr>
  <tr>
    <td><code>whitelist</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.</td>
  </tr>
  <tr>
    <td><code>forbidNonWhitelisted</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, instead of stripping non-whitelisted properties validator will throw an exception.</td>
  </tr>
  <tr>
    <td><code>forbidUnknownValues</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, attempts to validate unknown objects fail immediately.</td>
  </tr>
  <tr>
    <td><code>disableErrorMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validation errors will not be returned to the client.</td>
  </tr>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><code>number</code></td>
    <td>This setting allows you to specify which exception type will be used in case of an error. By default it throws <code>BadRequestException</code>.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Function</code></td>
    <td>Takes an array of the validation errors and returns an exception object to be thrown.</td>
  </tr>
  <tr>
    <td><code>groups</code></td>
    <td><code>string[]</code></td>
    <td>Groups to be used during validation of the object.</td>
  </tr>
  <tr>
    <td><code>always</code></td>
    <td><code>boolean</code></td>
    <td>Set default for <code>always</code> option of decorators. Default can be overridden in decorator options.</td>
  </tr>

  <tr>
    <td><code>strictGroups</code></td>
    <td><code>boolean</code></td>
    <td>If <code>groups</code> is not given or is empty, ignore decorators with at least one group.</td>
  </tr>
  <tr>
    <td><code>dismissDefaultMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, the validation will not use default messages. Error message always will be <code>undefined</code>        if
      its not explicitly set.</td>
  </tr>
  <tr>
    <td><code>validationError.target</code></td>
    <td><code>boolean</code></td>
    <td>Indicates if target should be exposed in <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>validationError.value</code></td>
    <td><code>boolean</code></td>
    <td>Indicates if validated value should be exposed in <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>stopAtFirstError</code></td>
    <td><code>boolean</code></td>
    <td>When set to true, validation of the given property will stop after encountering the first error. Defaults to false.</td>
  </tr>
  <tr>
    <td><code>errorFormat</code></td>
    <td><code>'list' | 'grouped'</code></td>
    <td>Specifies the format of validation error messages. <code>'list'</code> (default) returns an array of error message strings. <code>'grouped'</code> returns an object with property paths as keys and arrays of unmodified error messages as values, preserving custom validation messages without prepending parent path prefixes.</td>
  </tr>
</table>

> info **Notice** Find more information about the `class-validator` package in its [repository](https://github.com/typestack/class-validator).

#### Auto-validation

Start by binding `ValidationPipe` at the application level, so that every endpoint is protected from receiving invalid data.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

To test the pipe, create a basic endpoint:

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

> info **Hint** TypeScript does not emit metadata for **generics or interfaces**, so `ValidationPipe` cannot validate DTOs declared with them. Use concrete classes for your DTOs.

> info **Hint** Don't import DTOs with a type-only import, because type-only imports are erased at runtime. Write `import {{ '{' }} CreateUserDto {{ '}' }}` instead of `import type {{ '{' }} CreateUserDto {{ '}' }}`.

Next, add validation rules to the `CreateUserDto` with the decorators provided by the `class-validator` package (see the [full list](https://github.com/typestack/class-validator#validation-decorators)). Every route that uses `CreateUserDto` then enforces these rules.

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

With these rules in place, a request whose body contains an invalid `email` property receives a `400 Bad Request` response with the following body:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

`ValidationPipe` validates other parts of the request as well. For example, to accept only numeric values for the `:id` path parameter, use the following construct:

```typescript
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```

Like a DTO, `FindOneParams` is a class that defines validation rules with `class-validator`:

```typescript
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: string;
}
```

#### Disable detailed errors

Error messages explain what was wrong with a request, but some production environments prefer not to expose them. To disable detailed errors, pass an options object to the `ValidationPipe`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    disableErrorMessages: true,
  }),
);
```

As a result, the response body no longer contains detailed error messages.

#### Stripping properties

`ValidationPipe` can also filter out properties that the route handler should not receive. When you **whitelist** the acceptable properties, any property not included in the whitelist is stripped from the resulting object. For example, if the handler expects `email` and `password`, but a request also includes an `age` property, `age` is removed from the resulting DTO. To enable this behavior, set `whitelist` to `true`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

With this option enabled, properties without any decorator in the validation class are removed.

Alternatively, you can reject requests that contain non-whitelisted properties with an error response. To do so, set `forbidNonWhitelisted` to `true` in addition to `whitelist`.

<app-banner-courses></app-banner-courses>

#### Transform payload objects

Payloads arrive over the network as plain JavaScript objects. `ValidationPipe` can transform them into instances of their DTO classes. To enable auto-transformation, set `transform` to `true`. You can do this at the method level:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

To enable this behavior globally, set the option on a global pipe:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
);
```

With auto-transformation enabled, `ValidationPipe` also converts primitive types. In the following example, the `findOne()` method takes the `id` path parameter as an argument:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

Path parameters and query parameters always arrive as strings. Because the method signature declares `id` as a `number`, `ValidationPipe` converts the string identifier to a number.

#### Explicit conversion

The previous section showed how `ValidationPipe` implicitly converts query and path parameters based on their declared types. That conversion requires auto-transformation to be enabled.

With auto-transformation disabled, you can convert values explicitly with `ParseIntPipe` or `ParseBoolPipe`. There is no `ParseStringPipe`, because path and query parameters are already strings.

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
```

> info **Hint** The `ParseIntPipe` and `ParseBoolPipe` are exported from the `@nestjs/common` package.

#### Mapped types

Features such as **CRUD** (Create/Read/Update/Delete) often need several variants of a base type. Nest provides utility functions that perform these type transformations.

> warning **Warning** If your application uses the `@nestjs/swagger` package, see [this chapter](/openapi/mapped-types) for more information about mapped types. Likewise, if you use the `@nestjs/graphql` package, see [this chapter](/graphql/mapped-types). Both packages rely heavily on type metadata, so they export their own versions of these utilities. Importing them from `@nestjs/mapped-types` instead of `@nestjs/swagger` or `@nestjs/graphql` can cause undocumented side effects.

Input validation types (DTOs) often come in **create** and **update** variants of the same type: the **create** variant requires all fields, while the **update** variant makes them optional. The mapped types utilities derive such variants without repeating the property declarations or their validation decorators. Consider the following **create** type:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

> info **Hint** `PartialType()`, `PickType()`, `OmitType()`, and `IntersectionType()` are imported from the `@nestjs/mapped-types` package.

The `PartialType()` function returns a type (class) with all the properties of the input type set to optional:

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

The `PickType()` function constructs a type from a subset of the input type's properties:

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

The `OmitType()` function constructs a type with every property of the input type **except** the listed ones. The second argument is an array of property names:

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

The `IntersectionType()` function combines the properties of two types into one new type (class). For example, given an additional type:

```typescript
export class AdditionalCatInfo {
  color: string;
}
```

The following type contains the properties of both:

```typescript
export class UpdateCatDto extends IntersectionType(
  CreateCatDto,
  AdditionalCatInfo,
) {}
```

The type mapping utility functions are composable. For example, the following type has all of the properties of `CreateCatDto` except `name`, all set to optional:

```typescript
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```

#### Parsing and validating arrays

TypeScript does not emit metadata for generic types such as arrays, so `ValidationPipe` cannot validate the elements of an array parameter. In the following code, the elements of `createUserDtos` are not validated:

```typescript
@Post()
createBulk(@Body() createUserDtos: CreateUserDto[]) {
  return 'This action adds new users';
}
```

To validate the array, create a dedicated class with a property that wraps the array, or use the `ParseArrayPipe`:

```typescript
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
```

`ParseArrayPipe` is also useful for parsing query parameters. Consider a `findByIds()` method that returns users based on identifiers passed in the query string:

```typescript
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
```

This construction parses and validates the query parameters of a request such as the following:

```bash
GET /?ids=1,2,3
```

#### Schema-based validation

The `StandardSchemaValidationPipe` validates values against schemas instead of decorated classes. It accepts any schema that implements the [Standard Schema](https://standardschema.dev/) specification, which includes [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), and [ArkType](https://arktype.io/). The schema is the single source of truth for a payload: it validates the value at runtime, and its inferred type is the handler parameter's TypeScript type. The examples in this section use Zod.

```bash
$ npm i --save zod
```

Define a schema and infer the DTO type from it:

```typescript
@@filename(create-user.dto)
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().max(50).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
```

Next, bind the pipe at the application level:

```typescript
@@filename(main)
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

Then attach the schema to a parameter with the `schema` option of the parameter decorator:

```typescript
@@filename(users.controller)
@Post()
create(@Body({ schema: createUserSchema }) createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

The pipe validates only the parameters that declare a schema and passes every other value through unchanged, so binding it globally is safe. If the request body doesn't match the schema, the application responds with `400 Bad Request`. Each message is prefixed with the path of the invalid property:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "email: Invalid email address",
    "password: Too small: expected string to have >=8 characters"
  ]
}
```

The `schema` option is supported by `@Body()`, `@Query()`, and `@Param()`, as well as by `@MessageBody()` in [gateways](/websockets/gateways) and `@Payload()` in [microservices](/microservices/basics). Pass it as the only argument to validate the whole object, or after a property name to validate a single value:

```typescript
@Post('invitations')
invite(@Body('email', { schema: z.email() }) email: string) {
  return this.usersService.invite(email);
}
```

#### Coercion and transformation

Path parameters and query parameters always arrive as strings. Coercing schemas, such as `z.coerce.number()`, convert them before validating:

```typescript
@Get(':id')
findOne(@Param('id', { schema: z.coerce.number().int().positive() }) id: number) {
  return this.usersService.findOne(id);
}
```

Schemas can also apply defaults and transformations. The following schema describes the query string of a paginated list:

```typescript
@@filename(list-users-query.dto)
import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
```

```typescript
@Get()
findAll(@Query({ schema: listUsersQuerySchema }) query: ListUsersQuery) {
  return this.usersService.findAll(query);
}
```

For the request `GET /users?page=2&search=%20kamil%20`, the handler receives `page` as the number `2`, `limit` as the default `20`, and `search` as the trimmed string `'kamil'`.

By default, the pipe passes the schema's **output** to the handler, so coercion, defaults, and transformations take effect. To validate the value but pass the original input through unchanged, set `transform` to `false`. In that case, type the parameter with the schema's input type (`z.input<typeof schema>` in Zod).

#### Unknown properties

How a schema treats properties it doesn't declare is decided by the schema itself, not by the pipe. In Zod:

- `z.object()` strips unknown properties, like the `whitelist` option of `ValidationPipe`.
- `z.strictObject()` rejects them, like the `forbidNonWhitelisted` option. The error message is `Unrecognized key: "age"`.
- `z.looseObject()` keeps them.

#### Deriving schemas

The [mapped types](#mapped-types) utilities derive new DTO classes from existing ones. With schemas, the library's own methods serve the same purpose:

```typescript
@@filename(update-user.dto)
import { z } from 'zod';
import { createUserSchema } from './create-user.dto.js';

// All properties optional, like PartialType()
export const updateUserSchema = createUserSchema.partial();

// Only the listed properties, like PickType()
export const changeEmailSchema = createUserSchema.pick({ email: true });

// Every property except the listed ones, like OmitType()
export const publicProfileSchema = createUserSchema.omit({ password: true });

// Additional properties, like IntersectionType()
export const createAdminSchema = createUserSchema.extend({
  role: z.enum(['admin', 'editor']),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
```

Arrays need no special handling either. Wrap the item schema in `z.array()`, and every element is validated:

```typescript
@Post('bulk')
createBulk(
  @Body({ schema: z.array(createUserSchema) }) createUserDtos: CreateUserDto[],
) {
  return this.usersService.createMany(createUserDtos);
}
```

A message for an invalid element is prefixed with its index, e.g., `1.email: Invalid email address`.

#### Validating custom decorators

Parameter decorators created with [`createParamDecorator()`](/custom-decorators) accept the `schema` option too. For example, the following decorator extracts a tenant identifier from a request header:

```typescript
@@filename(tenant-id.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().headers['x-tenant-id'],
);
```

```typescript
@Get()
findAll(@TenantId({ schema: z.uuid() }) tenantId: string) {
  return this.projectsService.findAll(tenantId);
}
```

The pipe skips custom decorators unless you enable the `validateCustomDecorators` option:

```typescript
app.useGlobalPipes(
  new StandardSchemaValidationPipe({
    validateCustomDecorators: true,
  }),
);
```

#### Schema validation options

The `StandardSchemaValidationPipe` constructor accepts the following options:

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>transform</code></td>
    <td><code>boolean</code></td>
    <td>If <code>true</code>, the handler receives the value produced by the schema. If <code>false</code>, it receives the original input after successful validation. Default: <code>true</code>.</td>
  </tr>
  <tr>
    <td><code>validateCustomDecorators</code></td>
    <td><code>boolean</code></td>
    <td>If <code>true</code>, parameters of custom decorators created with <code>createParamDecorator()</code> are validated as well. Default: <code>false</code>.</td>
  </tr>
  <tr>
    <td><code>validateOptions</code></td>
    <td><code>Record&lt;string, unknown&gt;</code></td>
    <td>Options forwarded to the schema's <code>~standard.validate()</code> method, for libraries that support them.</td>
  </tr>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><code>number</code></td>
    <td>The HTTP status code of the exception thrown when validation fails. Default: <code>400</code>.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Function</code></td>
    <td>Receives the array of validation issues and returns the exception to throw.</td>
  </tr>
</table>

Use `exceptionFactory` to change the shape of the error response. Each issue has a `message` and, for nested values, a `path` whose segments are either property keys or objects with a `key` property:

```typescript
app.useGlobalPipes(
  new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new UnprocessableEntityException({
        message: 'Validation failed',
        errors: issues.map((issue) => ({
          path: issue.path
            ?.map((segment) => (typeof segment === 'object' ? segment.key : segment))
            .join('.'),
          message: issue.message,
        })),
      }),
  }),
);
```

With this factory, an invalid request produces a `422 Unprocessable Entity` response:

```json
{
  "message": "Validation failed",
  "errors": [
    { "path": "email", "message": "Invalid email address" },
    { "path": "password", "message": "Too small: expected string to have >=8 characters" }
  ]
}
```

#### Other schema libraries

Nothing in the pipe is specific to Zod. The same `schema` option accepts a Valibot schema:

```typescript
import * as v from 'valibot';

export const createUserSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
});

export type CreateUserDto = v.InferOutput<typeof createUserSchema>;
```

Or an ArkType schema:

```typescript
import { type } from 'arktype';

export const createUserSchema = type({
  email: 'string.email',
  password: 'string >= 8',
});

export type CreateUserDto = typeof createUserSchema.infer;
```

Error messages come from the library, so their wording differs between libraries.

> info **Hint** The same schemas can describe your API in the OpenAPI document. See [Standard Schema (Zod, Valibot)](/openapi/introduction#standard-schema-zod-valibot) in the OpenAPI chapter.

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/35-zod-validation).

#### WebSockets and Microservices

While this chapter shows examples using HTTP applications (e.g., Express or Fastify), both `ValidationPipe` and `StandardSchemaValidationPipe` work the same for WebSockets and microservices, regardless of the transport. By default, both throw an HTTP exception when validation fails. To report errors in a way the transport understands, return a `WsException` or an `RpcException` from the `exceptionFactory` option:

```typescript
new StandardSchemaValidationPipe({
  exceptionFactory: (issues) =>
    new WsException(issues.map((issue) => issue.message)),
});
```

#### Learn more

Read more about custom validators, error messages, and available decorators in the [class-validator](https://github.com/typestack/class-validator) repository. For schema libraries, see the [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), and [ArkType](https://arktype.io/) documentation, and the list of [Standard Schema compatible libraries](https://standardschema.dev/schema#what-schema-libraries-implement-the-spec).
