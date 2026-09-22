### Custom route decorators

Nest is built around a language feature called **decorators**. Decorators are well established in many programming languages but are still relatively new to JavaScript. For a deeper look at how decorators work, see [this article](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841). Here's a simple definition:

<blockquote class="external">
  An ES2016 decorator is an expression which returns a function and can take a target, name and property descriptor as arguments.
  You apply it by prefixing the decorator with an <code>@</code> character and placing this at the very top of what
  you are trying to decorate. Decorators can be defined for either a class, a method or a property.
</blockquote>

#### Param decorators

Nest provides a set of **param decorators** that you can use in HTTP route handlers. The following table lists them along with the plain Express (or Fastify) objects they represent:

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td>
    </tr>
    <tr>
      <td><code>@Response(), @Res()</code></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(param?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[param]</code></td>
    </tr>
    <tr>
      <td><code>@Body(param?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[param]</code></td>
    </tr>
    <tr>
      <td><code>@Query(param?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[param]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(param?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[param]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam(param?: string)</code></td>
      <td><code>req.hosts</code> / <code>req.hosts[param]</code></td>
    </tr>
  </tbody>
</table>

You can also create your own **custom decorators**. To see why this is useful, consider a common pattern in Node.js applications: properties are attached to the **request** object and then extracted manually in each route handler, with code like the following:

```typescript
const user = req.user;
```

To make your code more readable and transparent, you can create a `@User()` decorator and reuse it across all of your controllers:

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

You can then use it wherever you need it:

```typescript
@@filename()
@Get()
async findOne(@User() user: UserEntity) {
  console.log(user);
}
@@switch
@Get()
@Bind(User())
async findOne(user) {
  console.log(user);
}
```

#### Passing data

When the behavior of your decorator depends on some condition, use the `data` parameter to pass an argument to the decorator's factory function. One use case is a custom decorator that extracts a property from the request object by key. Suppose, for example, that your [authentication layer](/security/authentication#implementing-the-authentication-guard) validates requests and attaches a user entity to the request object. The user entity for an authenticated request might look like this:

```json
{
  "id": 101,
  "firstName": "Alan",
  "lastName": "Turing",
  "email": "alan@email.com",
  "roles": ["admin"]
}
```

Let's define a decorator that takes a property name as a key and returns the associated value if it exists (or `undefined` if it doesn't, or if the `user` object has not been created):

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
@@switch
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user && user[data] : user;
});
```

You can then access a particular property through the `@User()` decorator in the controller:

```typescript
@@filename()
@Get()
async findOne(@User('firstName') firstName: string) {
  console.log(`Hello ${firstName}`);
}
@@switch
@Get()
@Bind(User('firstName'))
async findOne(firstName) {
  console.log(`Hello ${firstName}`);
}
```

You can use the same decorator with different keys to access different properties. If the `user` object is deep or complex, this keeps route handler implementations simpler and more readable.

> info **Hint** `createParamDecorator<T>()` is generic, so you can enforce type safety explicitly, e.g., `createParamDecorator<string>((data, ctx) => ...)`. Alternatively, specify a parameter type in the factory function, e.g., `createParamDecorator((data: string, ctx) => ...)`. If you omit both, `data` is typed as `any`.

#### Working with pipes

Nest treats custom param decorators the same way as the built-in ones (`@Body()`, `@Param()`, and `@Query()`). This means pipes also run for parameters annotated with custom decorators (in our examples, the `user` argument). You can also apply a pipe directly to the custom decorator:

```typescript
@@filename()
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {
  console.log(user);
}
@@switch
@Get()
@Bind(User(new ValidationPipe({ validateCustomDecorators: true })))
async findOne(user) {
  console.log(user);
}
```

> info **Hint** By default, `ValidationPipe` does not validate arguments annotated with custom decorators. That's why the example above sets the `validateCustomDecorators` option to `true`.

Custom decorators also accept the `schema` option of the built-in parameter decorators. Pass a [Standard Schema](https://standardschema.dev/) compatible schema, such as a Zod schema, and a `StandardSchemaValidationPipe` with the `validateCustomDecorators` option enabled validates the decorator's value against it:

```typescript
@Get()
async findOne(@User('email', { schema: z.email() }) email: string) {
  console.log(email);
}
```

See [Validating custom decorators](/application/validation#validating-custom-decorators) for details.

#### Decorator composition

Nest provides the `applyDecorators()` helper to compose multiple decorators. For example, suppose you want to combine all authentication-related decorators into a single decorator:

```typescript
@@filename(auth.decorator)
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
@@switch
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function Auth(...roles) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
```

You can then use this custom `@Auth()` decorator as follows:

```typescript
@Get('users')
@Auth('admin')
findAllUsers() {}
```

This applies all four decorators with a single declaration.

> warning **Warning** The `@ApiHideProperty()` decorator from the `@nestjs/swagger` package is not composable and does not work correctly with the `applyDecorators()` function.
