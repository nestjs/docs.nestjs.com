### Migration guide

This article provides a set of guidelines for migrating from Nest version 6 to version 7.

#### Custom route decorators

The [Custom decorators](/custom-decorators) API has been unified for all types of applications. Now, whether you're creating a GraphQL application or a REST API, the factory passed into the `createParamDecorator()` function will take the `ExecutionContext` (read more [here](/fundamentals/execution-context)) object as a second argument.

```typescript
@@filename()
// Before
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, req) => {
  return req.user;
});

// After
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
@@switch
// Before
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, req) => {
  return req.user;
});

// After
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
```

#### Microservices

To avoid code duplication, the `MicroserviceOptions` interface has been removed from the `@nestjs/common` package. Therefore, now when you're creating a microservice (through either `createMicroservice()` or `connectMicroservice()` method), you should pass the type generic parameter to get code autocompletion.

```typescript
@@filename()
// Before
const app = await NestFactory.createMicroservice(AppModule);

// After
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule);
@@switch
// Before
const app = await NestFactory.createMicroservice(AppModule);

// After
const app = await NestFactory.createMicroservice(AppModule);
```

> info **Hint** The `MicroserviceOptions` interface is exported from the `@nestjs/microservices` package.

#### GraphQL

In the version 6 major release of NestJS, we introduced the code-first approach as a compatibility layer between the `type-graphql` package and the `@nestjs/graphql` module. Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility. To avoid numerous breaking changes, the public API is backward-compatible and may resemble `type-graphql`.

In order to migrate your existing application, simply rename all the `type-graphql` imports to the `@nestjs/graphql`. If you used more advanced features, you might need to also:

- use `Type` (imported from `@nestjs/common`) instead of `ClassType` (imported from `type-graphql`)
- move methods that require `@Args()` from object types (classes annotated with `@ObjectType()` decorator) under resolver classes (and use `@ResolveField()` decorator instead of `@Field()`)

#### HTTP exceptions body

Previously, the generated response bodies for the `HttpException` class and other exceptions derived from it (e.g., `BadRequestException` or `NotFoundException`) were inconsistent. In the latest major release, these exception responses will follow the same structure.

```typescript
/*
 * Sample outputs for "throw new ForbiddenException('Forbidden resource')"
 */

// Before
{
  "statusCode": 403,
  "message": "Forbidden resource"
}

// After
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

#### Validation errors schema

In past releases, the `ValidationPipe` threw an array of the `ValidationError` objects returned by the `class-validator` package. Now, `ValidationPipe` will map errors to a list of plain strings representing error messages.

```typescript
// Before
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    {
      "target": {},
      "property": "email",
      "children": [],
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}

// After
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

If you prefer the previous approach, you can restore it by setting the `exceptionFactory` function:

```typescript
new ValidationPipe({
  exceptionFactory: errors => new BadRequestException(errors),
});
```

#### Implicit type conversion (`ValidationPipe`)

With the auto-transformation option enabled (`transform: true`), the `ValidationPipe` will now perform conversion of primitive types. In the following example, the `findOne()` method takes one argument which represents an extracted `id` path parameter:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

By default, every path parameter and query parameter comes over the network as a `string`. In the above example, we specified the `id` type as a `number` (in the method signature). Therefore, the `ValidationPipe` will try to automatically convert a string identifier to a number.

#### Microservice channels (bidirectional communication)

To enable the request-response message type, Nest creates two logical channels - one is responsible for transferring the data while the other waits for incoming responses. For some underlying transports, such as NATS, this dual-channel support is provided out-of-the-box. For others, Nest compensates by manually creating separate channels.

Let's say that we have a single message handler `@MessagePattern('getUsers')`. In the past, Nest built two channels from this pattern: `getUsers_ack` (for requests) and `getUsers_res` (for responses). With version 7, this naming scheme changes. Now Nest will build `getUsers` (for requests) and `getUsers.reply` (for responses) instead. Also, specifically for the MQTT transport strategy, the response channel would be `getUsers/reply` (to avoid conflicts with topic wildcards).

#### Deprecations

All deprecations (from Nest version 5 to version 6) have been finally removed (e.g., the deprecated `@ReflectMetadata` decorator).

#### Node.js

This release drops support for Node v8. We strongly recommend using the latest LTS version.
