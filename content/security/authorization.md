### Authorization

**Authorization** is the process that determines what a user is allowed to do. For example, an administrative user may create, edit, and delete posts, while a non-administrative user may only read them.

Authorization is orthogonal to, and independent of, authentication. However, authorization requires an authentication mechanism.

There are many approaches to handling authorization, and the right one for a project depends on its requirements. This chapter presents a few approaches that you can adapt to a variety of requirements.

#### Basic RBAC implementation

Role-based access control (**RBAC**) is a policy-neutral access control mechanism defined around roles and privileges. This section shows how to implement a basic RBAC mechanism using Nest [guards](/guards).

First, create a `Role` enum representing the roles in the system:

```typescript
@@filename(role.enum)
export enum Role {
  User = 'user',
  Admin = 'admin',
}
```

> info **Hint** In more sophisticated systems, you may store roles in a database or pull them from an external authentication provider.

With this in place, create a `@Roles()` decorator. It lets you specify which roles are required to access specific resources.

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
```

You can now use the `@Roles()` decorator on any route handler:

```typescript
@@filename(cats.controller)
@Post()
@Roles(Role.Admin)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(Role.Admin)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Finally, create a `RolesGuard` class that compares the roles assigned to the current user with the roles required by the route being processed. To read the route's roles (custom metadata), use the `Reflector` helper class, which the framework provides out of the box and exports from the `@nestjs/core` package.

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum.js';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator.js';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

> info **Hint** See the [Reflection and metadata](/fundamentals/execution-context#reflection-and-metadata) section of the execution context chapter for more details on using `Reflector` in a context-sensitive way.

> warning **Notice** This example is called "**basic**" because it checks roles only at the route handler level. In real-world applications, a single endpoint may involve several operations, each requiring a specific set of permissions. In that case, you have to check roles somewhere within your business logic, which is harder to maintain because no single place associates permissions with specific actions.

This example assumes that `request.user` contains the user instance and its roles (under the `roles` property). In your app, you will probably make that association in your custom **authentication guard**. See the [authentication](/security/authentication) chapter for more details.

For this example to work, your `User` class must look as follows:

```typescript
class User {
  // ...other properties
  roles: Role[];
}
```

Lastly, register the `RolesGuard`, either at the controller level or globally:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```

When a user with insufficient privileges requests an endpoint, Nest automatically returns the following response:

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

> info **Hint** To return a different error response, throw your own exception instead of returning a boolean value.

<app-banner-courses-auth></app-banner-courses-auth>

#### Claims-based authorization

When an identity is created, it may be assigned one or more claims issued by a trusted party. A claim is a name-value pair that represents what the subject can do, not what the subject is.

To implement claims-based authorization in Nest, follow the same steps as in the [RBAC](/security/authorization#basic-rbac-implementation) section, with one significant difference: instead of checking for specific roles, compare **permissions**. Each user has a set of assigned permissions, and each resource or endpoint defines which permissions are required to access it (for example, through a dedicated `@RequirePermissions()` decorator).

```typescript
@@filename(cats.controller)
@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@RequirePermissions(Permission.CREATE_CAT)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Hint** In the example above, `Permission` (similar to the `Role` enum in the RBAC section) is a TypeScript enum that contains all the permissions available in your system.

#### Integrating CASL

[CASL](https://casl.js.org/) is an isomorphic authorization library that restricts which resources a given client is allowed to access. It's designed to be incrementally adoptable and scales from simple claim-based authorization to fully featured subject- and attribute-based authorization.

To start, install the `@casl/ability` package:

```bash
$ npm i @casl/ability
```

> info **Hint** This example uses CASL, but you can use any other library, such as `accesscontrol` or `acl`, depending on your preferences and project needs.

To illustrate the mechanics of CASL, we'll define two entity classes: `User` and `Article`.

```typescript
class User {
  id: number;
  isAdmin: boolean;
}
```

The `User` class has two properties: `id`, a unique user identifier, and `isAdmin`, which indicates whether the user has administrator privileges.

```typescript
class Article {
  id: number;
  isPublished: boolean;
  authorId: number;
}
```

The `Article` class has three properties: `id`, a unique article identifier; `isPublished`, which indicates whether the article has been published; and `authorId`, the ID of the user who wrote the article.

Now let's review and refine the requirements for this example:

- Admins can manage (create/read/update/delete) all entities.
- Users have read-only access to everything.
- Users can update their own articles (`article.authorId === userId`).
- Published articles cannot be removed (`article.isPublished === true`).

With this in mind, start by creating an `Action` enum representing all the actions users can perform on entities:

```typescript
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

> warning **Notice** `manage` is a special keyword in CASL which represents "any action".

To encapsulate the CASL library, generate the `CaslModule` and `CaslAbilityFactory`:

```bash
$ nest g module casl
$ nest g class casl/casl-ability.factory
```

With this in place, define the `createForUser()` method on the `CaslAbilityFactory`. This method creates the ability object for a given user:

```typescript
type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.isAdmin) {
      can(Action.Manage, 'all'); // read-write access to everything
    } else {
      can(Action.Read, 'all'); // read-only access to everything
    }

    can(Action.Update, Article, { authorId: user.id });
    cannot(Action.Delete, Article, { isPublished: true });

    return build({
      // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
```

> warning **Notice** `all` is a special keyword in CASL that represents "any subject".

> info **Hint** Since CASL v6, `MongoAbility` (created with `createMongoAbility()`) is the default ability type, replacing the legacy `Ability` class, to better support condition-based permissions. Despite the name, it is not tied to MongoDB: it works with any kind of data by comparing objects against conditions written in MongoDB query syntax.

> info **Hint** `AbilityBuilder`, `createMongoAbility`, `MongoAbility`, `InferSubjects`, and `ExtractSubjectType` are exported from the `@casl/ability` package.

> info **Hint** The `detectSubjectType` option tells CASL how to get the subject type from an object. For more information, see the [CASL documentation on subject type detection](https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types).

In the example above, the `MongoAbility` instance is created with the `AbilityBuilder` class. The `can` and `cannot` functions accept the same arguments but have opposite meanings: `can` allows an action on the specified subject, and `cannot` forbids it. Both accept up to four arguments (action, subject, fields, and conditions). To learn more about these functions, see the official [CASL documentation](https://casl.js.org/v6/en/guide/intro).

Lastly, add the `CaslAbilityFactory` to the `providers` and `exports` arrays in the `CaslModule` definition:

```typescript
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory.js';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
```

With this in place, you can inject the `CaslAbilityFactory` into any class using standard constructor injection, as long as the `CaslModule` is imported in the host module:

```typescript
constructor(private caslAbilityFactory: CaslAbilityFactory) {}
```

Then use it in a class as follows.

```typescript
const ability = this.caslAbilityFactory.createForUser(user);
if (ability.can(Action.Read, 'all')) {
  // "user" has read access to everything
}
```

> info **Hint** Learn more about the `MongoAbility` class in the official [CASL documentation](https://casl.js.org/v6/en/guide/intro).

For example, consider a user who is not an admin. This user should be able to read articles, but not create new ones or remove existing ones.

```typescript
const user = new User();
user.isAdmin = false;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Read, Article); // true
ability.can(Action.Delete, Article); // false
ability.can(Action.Create, Article); // false
```

> info **Hint** Although both `MongoAbility` and `AbilityBuilder` classes provide `can` and `cannot` methods, they have different purposes and accept slightly different arguments.

As specified in the requirements, the user should also be able to update their own articles:

```typescript
const user = new User();
user.id = 1;

const article = new Article();
article.authorId = user.id;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Update, article); // true

article.authorId = 2;
ability.can(Action.Update, article); // false
```

The `MongoAbility` instance lets you check permissions in a readable way. Likewise, `AbilityBuilder` lets you define permissions (and specify conditions) in a similar fashion. For more examples, see the official [CASL documentation](https://casl.js.org/v6/en/guide/intro).

#### Advanced: Implementing a `PoliciesGuard`

This section shows how to build a more sophisticated guard, which checks whether a user meets specific **authorization policies** configured at the method level (you can extend it to respect policies configured at the class level too). The example uses the CASL package for illustration only; using this library is not required. It also uses the `CaslAbilityFactory` provider created in the previous section.

First, the requirements. The goal is a mechanism that lets you specify policy checks per route handler. It supports both objects and functions (for simpler checks, and for those who prefer a more functional style).

Start by defining interfaces for policy handlers:

```typescript
import { AppAbility } from '../casl/casl-ability.factory.js';

interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
```

There are two ways to define a policy handler: an object (an instance of a class that implements the `IPolicyHandler` interface) or a function (matching the `PolicyHandlerCallback` type).

With this in place, create a `@CheckPolicies()` decorator. It lets you specify which policies must be met to access specific resources.

```typescript
export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
```

Now create a `PoliciesGuard` that extracts and executes all the policy handlers bound to a route handler.

```typescript
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
```

> info **Hint** This example assumes that `request.user` contains the user instance. In your app, you will probably make that association in your custom **authentication guard**. See the [authentication](/security/authentication) chapter for more details.

Let's break this example down. `policyHandlers` is the array of handlers assigned to the method through the `@CheckPolicies()` decorator. Next, the `CaslAbilityFactory#createForUser` method constructs the ability object, which verifies whether the user has sufficient permissions to perform specific actions. The guard passes this object to each policy handler, which is either a function or an instance of a class that implements `IPolicyHandler` (exposing a `handle()` method that returns a boolean). Lastly, `Array#every` ensures that every handler returned `true`.

To test this guard, bind it to any route handler and register an inline policy handler (the functional approach), as follows:

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
findAll() {
  return this.articlesService.findAll();
}
```

Alternatively, define a class that implements the `IPolicyHandler` interface:

```typescript
export class ReadArticlePolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, Article);
  }
}
```

Then use it as follows:

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies(new ReadArticlePolicyHandler())
findAll() {
  return this.articlesService.findAll();
}
```

> warning **Notice** Because the policy handler is instantiated in place with the `new` keyword, the `ReadArticlePolicyHandler` class cannot use dependency injection. You can address this with the `ModuleRef#get` method (see the [module reference](/fundamentals/module-ref) chapter). Instead of registering functions and instances through the `@CheckPolicies()` decorator, support passing a `Type<IPolicyHandler>`. Then, inside your guard, retrieve an instance by its type reference with `moduleRef.get(YOUR_HANDLER_TYPE)`, or instantiate it dynamically with the `ModuleRef#create` method.
