### Serialization

Serialization happens before objects are returned in a network response. It is the right place to define rules for transforming and sanitizing the data sent to the client. For example, sensitive data such as passwords must always be excluded from the response, and some properties may need further transformation, such as returning only a subset of an entity's properties. Performing these transformations manually in every handler is tedious and error-prone, and makes it hard to be sure that every case is covered.

#### Overview

Nest provides two built-in interceptors that apply these rules declaratively:

- `ClassSerializerInterceptor` uses the [class-transformer](https://github.com/typestack/class-transformer) package. It takes the value returned by a route handler and applies the `instanceToPlain()` function to it, which honors the `class-transformer` decorators declared on the entity or DTO class. The first part of this chapter covers this approach.

- `StandardSchemaSerializerInterceptor` validates and transforms responses with a schema written in [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), [ArkType](https://arktype.io/), or any other [Standard Schema](https://standardschema.dev/) compatible library. See [Schema-based serialization](#schema-based-serialization).

> info **Hint** Neither interceptor serializes [StreamableFile](/http/file-upload#streaming-files) responses.

#### Exclude properties

Suppose you want to exclude the `password` property of a user entity from every response. Annotate the entity as follows:

```typescript
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```

Now consider a controller with a route handler that returns an instance of this class:

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    password: 'password',
  });
}
```

> warning **Warning** The handler must return an instance of the class. A plain JavaScript object, such as `{{ '{' }} user: new UserEntity() {{ '}' }}`, is not serialized correctly. To serialize plain objects, see [Transform plain objects](#transform-plain-objects).

> info **Hint** The `ClassSerializerInterceptor` is imported from `@nestjs/common`.

When this endpoint is requested, the client receives the following response:

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe"
}
```

The interceptor can also be bound application-wide (see [Binding interceptors](/interceptors#binding-interceptors)). Together, the interceptor and the entity class declaration ensure that **every** route handler that returns a `UserEntity` omits the `password` property, which enforces this rule in one place.

#### Expose properties

Use the `@Expose()` decorator to provide alias names for properties, or to compute a property value with a function (similar to a **getter**), as shown below.

```typescript
@Expose()
get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
}
```

#### Transform

Use the `@Transform()` decorator for additional data transformation. For example, the following construct returns the `name` property of the `RoleEntity` instead of the whole object.

```typescript
@Transform(({ value }) => value.name)
role: RoleEntity;
```

#### Pass options

To override the default behavior of the transformation functions, pass options to the `@SerializeOptions()` decorator.

```typescript
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return new UserEntity();
}
```

> info **Hint** The `@SerializeOptions()` decorator is imported from `@nestjs/common`.

Options passed to `@SerializeOptions()` are forwarded as the second argument of the underlying `instanceToPlain()` function. In this example, all properties that begin with the `_` prefix are excluded.

#### Transform plain objects

The `type` option of `@SerializeOptions()` converts responses into instances of the specified class before they are serialized, so the class's `class-transformer` decorators apply even when the handler returns a plain object. This removes the need to instantiate the class or call `plainToInstance()` in every handler.

In the example below, both conditional branches return plain JavaScript objects, which are converted into `UserEntity` instances with the relevant decorators applied:

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: UserEntity })
@Get()
findOne(@Query() { id }: { id: number }): UserEntity {
  if (id === 1) {
    return {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      password: 'password',
    };
  }

  return {
    id: 2,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password2',
  };
}
```

> info **Hint** Declaring the handler's return type lets TypeScript check that the returned plain object matches the shape of the DTO or entity. The `plainToInstance()` function doesn't provide this type checking, so a mismatched object can go unnoticed.


#### Schema-based serialization

The `StandardSchemaSerializerInterceptor` shapes responses with a schema instead of class decorators. The schema describes exactly what leaves the API: the interceptor runs the value returned by the route handler through the schema and sends the schema's output to the client. It accepts any schema that implements the [Standard Schema](https://standardschema.dev/) specification. The examples in this section use Zod.

Because `z.object()` strips properties the schema doesn't declare, a response schema is also an allowlist. The following schema guarantees that a user's `password` is never sent, even when the service returns the full database row:

```typescript
@@filename(user-response.schema)
import { z } from 'zod';

export const userResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
```

Bind the interceptor and select the schema with the `schema` option of the `@SerializeOptions()` decorator:

```typescript
@@filename(users.controller)
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { userResponseSchema } from './user-response.schema.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseInterceptors(StandardSchemaSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @SerializeOptions({ schema: userResponseSchema })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get()
  @SerializeOptions({ schema: userResponseSchema })
  findAll() {
    return this.usersService.findAll();
  }
}
```

The service returns user records that include a `password` property, but the client receives only the declared properties:

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe"
}
```

When a handler returns an array, as `findAll()` does, the interceptor applies the schema to **each element**. Pass the schema of a single item, not an array schema.

`null`, `undefined`, primitive values, and `StreamableFile` responses are sent unchanged, as are responses of handlers without a schema.

#### Transforming responses with schemas

Schema transformations cover what `@Expose()` and `@Transform()` do for classes. The following schema adds a computed `fullName` property and replaces the nested `role` object with its name:

```typescript
@@filename(user-response.schema)
import { z } from 'zod';

export const userResponseSchema = z
  .object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.object({ id: z.number(), name: z.string() }),
  })
  .transform((user) => ({
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role.name,
  }));
```

For a user with the `admin` role, the client receives:

```json
{
  "id": 1,
  "fullName": "John Doe",
  "role": "admin"
}
```

The same schema written with Valibot uses `v.pipe()` and `v.transform()`:

```typescript
import * as v from 'valibot';

export const userResponseSchema = v.pipe(
  v.object({
    id: v.number(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.object({ id: v.number(), name: v.string() }),
  }),
  v.transform((user) => ({
    id: user.id,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role.name,
  })),
);
```

#### Binding the schema serializer

`@SerializeOptions()` can decorate a controller class as well as a route handler. A schema set on the class applies to all of its handlers, and a schema set on a handler takes precedence:

```typescript
@Controller('users')
@UseInterceptors(StandardSchemaSerializerInterceptor)
@SerializeOptions({ schema: userResponseSchema })
export class UsersController {}
```

To bind the interceptor application-wide, pass it the `Reflector` instance, which the interceptor uses to read the `@SerializeOptions()` metadata:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(
  new StandardSchemaSerializerInterceptor(app.get(Reflector)),
);
```

Alternatively, register it with the `APP_INTERCEPTOR` token, as described in [Binding interceptors](/interceptors#binding-interceptors), and Nest injects the `Reflector` for you. Handlers without a schema are not affected by the global interceptor.

The interceptor constructor also accepts default options, which apply when neither the handler nor its controller sets a schema:

<table>
  <tr>
    <td><code>schema</code></td>
    <td>The default schema used when <code>@SerializeOptions()</code> doesn't provide one.</td>
  </tr>
  <tr>
    <td><code>validateOptions</code></td>
    <td>Options forwarded to the schema's <code>~standard.validate()</code> method, for libraries that support them. A handler can override them with the <code>validateOptions</code> option of <code>@SerializeOptions()</code>.</td>
  </tr>
</table>

#### Serialization errors

A response that doesn't match its schema, such as a record with a missing or mistyped property, indicates a bug on the server, not a problem with the request. In that case, the interceptor throws an error that lists the schema's issues, and the client receives a `500 Internal Server Error` response instead of partially serialized data. The error message, including the issues, is logged by the default exception filter.

A working example that uses Valibot is available [here](https://github.com/nestjs/nest/tree/master/sample/36-valibot-serializer).

#### Example

A working example of the `ClassSerializerInterceptor` is available [here](https://github.com/nestjs/nest/tree/master/sample/21-serializer).

#### WebSockets and Microservices

While this chapter shows examples using HTTP applications (e.g., Express or Fastify), both `ClassSerializerInterceptor` and `StandardSchemaSerializerInterceptor` work the same for WebSockets and microservices, regardless of the transport.

#### Learn more

Read more about available decorators and options in the [class-transformer](https://github.com/typestack/class-transformer) repository. For schema libraries, see the [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), and [ArkType](https://arktype.io/) documentation.
