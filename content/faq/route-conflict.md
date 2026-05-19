### Route conflict detection

When using Express (the default adapter), NestJS registers routes in the order they are declared. This means a parametric route like `@Get(':id')` can silently steal traffic meant for a more specific route like `@Get('me')` if it happens to be declared first. The tricky part is that nothing goes wrong at startup. The application boots cleanly and the problem only shows up at runtime when requests start going to the wrong handler.

> warning **Warning** Adding a pipe like `ParseIntPipe` to the parametric route does not help here. Pipes run **after** the router has already picked a handler, so the wrong handler is still called.

As of v12, Nest provides two opt-in options on `NestApplicationOptions` that give you more control over this.

#### Route conflict policy

The `routeConflictPolicy` option tells Nest to inspect routes at bootstrap time and report any conflicts it finds. It accepts an object with two independent keys, `duplicate` and `shadow`. Each key can be set to `'off'` (the default, no check performed), `'warn'` (log a warning), or `'error'` (throw at startup).

| Kind | Triggers when |
| --- | --- |
| `duplicate` | Two routes share the same method, path, host, and version. |
| `shadow` | Two routes can match the same request, e.g. `/users/me` and `/users/:id`. |

```typescript
const app = await NestFactory.create(AppModule, {
  routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
});
```

With `'warn'`, Nest prints a warning for each conflicting pair before the server starts. With `'error'`, every conflict is collected into a single `RouteConflictException` that is thrown during `app.listen()`, so you see all problems at once rather than one per application restart.

```typescript
import { RouteConflictException } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    routeConflictPolicy: { duplicate: 'error', shadow: 'error' },
  });

  try {
    await app.listen(3000);
  } catch (err) {
    if (err instanceof RouteConflictException) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}
bootstrap();
```

#### Route resolution strategy

The `routeResolutionStrategy` option controls the order in which routes are handed to the underlying HTTP adapter. It accepts either `'declaration'` (the default, keeps existing behavior) or `'specificity'`.

With `'specificity'`, Nest sorts routes before registering them so that the most specific ones are always registered first. Literal segments win over parametric segments, which win over wildcards. This means the example below works correctly no matter which handler is declared first:

```typescript
@@filename(users.controller)
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return `User #${id}`;
  }

  @Get('me')
  getMe() {
    return 'the current user';
  }
}
@@switch
@Controller('users')
export class UsersController {
  @Get(':id')
  @Bind(Param('id'))
  findOne(id) {
    return `User #${id}`;
  }

  @Get('me')
  getMe() {
    return 'the current user';
  }
}
```

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    routeResolutionStrategy: 'specificity',
  });
  await app.listen(3000);
}
bootstrap();
```

Even though `@Get(':id')` is declared first, `GET /users/me` will reach `getMe()` because Nest registers `/me` before `/:id`.

Both options can be combined:

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    routeConflictPolicy: { duplicate: 'error', shadow: 'warn' },
    routeResolutionStrategy: 'specificity',
  });
  await app.listen(3000);
}
bootstrap();
```

#### Adapter differences

These options work slightly differently depending on which HTTP adapter your application uses.

**Express** is order-sensitive, so both conflict kinds (`duplicate` and `shadow`) are active, and `'specificity'` re-orders routes before they are registered.

**Fastify** uses a radix-tree router (`find-my-way`) that already handles route specificity internally, so literal segments always win over parametric ones regardless of registration order. For this reason:

- The `shadow` kind is automatically suppressed when running on Fastify. Since Fastify's router never misroutes these cases, reporting them would just be false positives.
- The `duplicate` kind remains active. Registering two routes with the same method, path, host, and version is a genuine bug on any adapter. When Fastify encounters one it throws `FST_ERR_DUPLICATED_ROUTE` and crashes. Setting `duplicate: 'warn'` or `duplicate: 'error'` lets Nest catch these before the adapter does and surface a descriptive `RouteConflictException` instead.
- Setting `routeResolutionStrategy: 'specificity'` on Fastify is a no-op since the adapter already handles ordering itself.

#### Available types

The following types are exported from `@nestjs/common`:

```typescript
import {
  RouteConflictPolicy,
  RouteConflictPolicyLevel,
  RouteResolutionStrategy,
} from '@nestjs/common';
```
