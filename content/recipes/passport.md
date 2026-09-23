### Passport (authentication)

[Passport](https://github.com/jaredhanson/passport) is the most popular Node.js authentication library, well known in the community and used in many production applications. You can integrate it with a **Nest** application using the `@nestjs/passport` module. At a high level, Passport executes a series of steps to:

- Authenticate a user by verifying their "credentials" (such as username/password, JSON Web Token ([JWT](https://jwt.io/)), or identity token from an Identity Provider)
- Manage authenticated state (by issuing a portable token, such as a JWT, or creating an [Express session](https://github.com/expressjs/session))
- Attach information about the authenticated user to the `Request` object for further use in route handlers

Passport has a rich ecosystem of [strategies](http://www.passportjs.org/) that implement various authentication mechanisms. While simple in concept, the set of Passport strategies to choose from is large and varied. Passport abstracts these varied steps into a standard pattern, and the `@nestjs/passport` module wraps this pattern in familiar Nest constructs.

In this chapter, we'll implement a complete end-to-end authentication solution for a RESTful API server using these modules. You can follow the steps in this chapter to build the complete example, and apply the same concepts to implement any Passport strategy and customize your authentication scheme.

#### Authentication requirements

For this use case, clients start by authenticating with a username and password. Once authenticated, the server issues a JWT that the client can send as a [bearer token in an authorization header](https://tools.ietf.org/html/rfc6750) on subsequent requests to prove authentication. We'll also create a protected route that is accessible only to requests that contain a valid JWT.

We'll start with the first requirement: authenticating a user. We'll then extend that by issuing a JWT. Finally, we'll create a protected route that checks for a valid JWT on the request.

First, install the required packages. Passport provides a strategy called [passport-local](https://github.com/jaredhanson/passport-local) that implements a username/password authentication mechanism, which suits this part of our use case.

```bash
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
```

> warning **Notice** For **any** Passport strategy you choose, you always need the `@nestjs/passport` and `passport` packages. You also need the strategy-specific package (e.g., `passport-jwt` or `passport-local`) that implements the authentication strategy you are building. You can also install the type definitions for the strategy, as shown above with `@types/passport-local`, to get type checking and editor assistance while writing TypeScript code.

#### Implementing Passport strategies

We're now ready to implement the authentication feature. We'll start with an overview of the process used for **any** Passport strategy. It's helpful to think of Passport as a mini framework in itself. It abstracts the authentication process into a few basic steps that you customize based on the strategy you're implementing. It's like a framework because you configure it by supplying customization parameters (as plain JSON objects) and custom code in the form of callback functions, which Passport calls at the appropriate time. The `@nestjs/passport` module wraps this framework in a Nest-style package, so that it integrates naturally into a Nest application. We'll use `@nestjs/passport` below, but first, let's consider how **vanilla Passport** works.

In vanilla Passport, you configure a strategy by providing two things:

1. A set of options that are specific to that strategy. For example, in a JWT strategy, you might provide a secret to sign tokens.
2. A "verify callback", which is where you tell Passport how to interact with your user store (where you manage user accounts). Here, you verify whether a user exists (and/or create a new user), and whether their credentials are valid. Passport expects this callback to return a full user if the validation succeeds, or `null` if it fails (failure means either that the user is not found or, in the case of passport-local, that the password does not match).

With `@nestjs/passport`, you configure a Passport strategy by extending the `PassportStrategy` class. You pass the strategy options (item 1 above) by calling `super()` in your subclass's constructor, optionally with an options object. You provide the verify callback (item 2 above) by implementing a `validate()` method in your subclass.

We'll start by generating an `AuthModule` and in it, an `AuthService`:

```bash
$ nest g module auth
$ nest g service auth
```

The `AuthService` will rely on a `UsersService` that encapsulates user operations, so generate that module and service now as well:

```bash
$ nest g module users
$ nest g service users
```

Replace the default contents of these generated files as shown below. In this sample app, `UsersService` keeps a hard-coded, in-memory list of users and exposes a `findOne()` method that looks up a user by username. In a real application, this is where you build your user model and persistence layer with your library of choice (e.g., TypeORM, Sequelize, Mongoose).

```typescript
@@filename(users/users.service)
import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
```

In the `UsersModule`, the only change needed is to add the `UsersService` to the `exports` array of the `@Module()` decorator, so that it's visible outside this module (we'll use it in our `AuthService` shortly).

```typescript
@@filename(users/users.module)
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
@@switch
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Our `AuthService` retrieves a user and verifies the password. We create a `validateUser()` method for this purpose. In the code below, we use object rest syntax to strip the `password` property from the user object before returning it. Our Passport local strategy will call the `validateUser()` method in a moment.

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
```

> warning **Warning** In a real application, never store a password in plain text. Instead, use a library like [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme) with a salted one-way hash algorithm. With that approach, you store only hashed passwords and compare the stored hash to a hashed version of the **incoming** password, so user passwords are never stored or exposed in plain text. To keep our sample app simple, we violate that rule and use plain text. **Don't do this in your real app.**

Now, update the `AuthModule` to import the `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
```

#### Implementing Passport local

Now we can implement our Passport **local authentication strategy**. Create a file called `local.strategy.ts` in the `auth` folder and add the following code:

```typescript
@@filename(auth/local.strategy)
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
@@switch
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(username, password) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

We've followed the recipe described earlier for all Passport strategies. Our use of passport-local needs no configuration options, so the constructor calls `super()` without an options object.

> info **Hint** You can pass an options object in the call to `super()` to customize the behavior of the Passport strategy. In this example, the passport-local strategy by default expects properties called `username` and `password` in the request body. Pass an options object to specify different property names, for example: `super({{ '{' }} usernameField: 'email' {{ '}' }})`. See the [Passport documentation](http://www.passportjs.org/docs/configure/) for more information.

We've also implemented the `validate()` method. For each strategy, Passport calls the verify function (implemented with the `validate()` method in `@nestjs/passport`) with a strategy-specific set of parameters. For the local strategy, Passport expects a `validate()` method with the following signature: `validate(username: string, password: string): any`.

Most of the validation work is done in our `AuthService` (with the help of our `UsersService`), so this method is short. The `validate()` method for **any** Passport strategy follows a similar pattern, varying only in how credentials are represented. If a user is found and the credentials are valid, the method returns the user so that Passport can complete its tasks (e.g., creating the `user` property on the `Request` object), and the request handling pipeline can continue. If not, it throws an exception and lets our [exceptions layer](/exception-filters) handle it.

Typically, the only significant difference in the `validate()` method for each strategy is **how** you determine whether a user exists and is valid. For example, in a JWT strategy, depending on requirements, we may check whether the `userId` carried in the decoded token matches a record in our user database, or appears in a list of revoked tokens. This pattern of subclassing and implementing strategy-specific validation is consistent and extensible.

Next, configure the `AuthModule` to use the Passport features we just defined. Update `auth.module.ts` to look like this:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy.js';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy.js';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
```

#### Built-in Passport Guards

The [Guards](/guards) chapter describes the primary function of guards: to determine whether a request will be handled by the route handler. That remains true, and we'll use that standard capability soon. However, the `@nestjs/passport` module also introduces a new wrinkle that may be confusing at first, so let's discuss it now. From an authentication perspective, your app can be in one of two states:

1. the user/client is **not** logged in (is not authenticated)
2. the user/client **is** logged in (is authenticated)

In the first case (user is not logged in), we need to perform two distinct functions:

- Restrict the routes an unauthenticated user can access (i.e., deny access to restricted routes). We'll use guards in their familiar capacity to handle this function, by placing a guard on the protected routes. This guard checks for the presence of a valid JWT, so we'll build it later, once we are issuing JWTs.

- Initiate the **authentication step** itself when a previously unauthenticated user attempts to log in. This is the step where we'll **issue** a JWT to a valid user. The client needs to `POST` username/password credentials to initiate authentication, so we'll set up a `POST /auth/login` route to handle that. The remaining question is how to invoke the passport-local strategy in that route.

The answer is another, slightly different type of guard. The `@nestjs/passport` module provides a built-in guard that invokes the Passport strategy and kicks off the steps described above (retrieving credentials, running the verify function, creating the `user` property, etc.).

The second case (a logged-in user) relies on the standard type of guard discussed above to allow access to protected routes.

<app-banner-courses-auth></app-banner-courses-auth>

#### Login route

With the strategy in place, we can now implement a bare-bones `/auth/login` route and apply the built-in guard to initiate the passport-local flow.

Open the `app.controller.ts` file and replace its contents with the following:

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req: any) {
    return req.user;
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return req.user;
  }
}
```

`AuthGuard('local')` creates a guard that invokes the Passport strategy registered under the name `'local'`. When we extended the passport-local strategy, `@nestjs/passport` registered our `LocalStrategy` with Passport under that default name, which comes from the `passport-local` package. The name tells the guard which strategy to invoke when the app has multiple Passport strategies. We only have one strategy so far, but we'll add a second one shortly.

To test the route, we'll have `/auth/login` return the user for now. This also demonstrates another feature: the guard takes the value returned from the `validate()` method and assigns it to the `Request` object as `req.user`. Later, we'll replace this with code that creates and returns a JWT.

Since these are API routes, we'll test them using the widely available [cURL](https://curl.se/) command-line tool. You can test with any of the `user` objects hard-coded in the `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"userId":1,"username":"john"}
```

While this works, passing the strategy name directly to `AuthGuard()` introduces magic strings in the codebase. Instead, we recommend creating your own class, as shown below:

```typescript
@@filename(auth/local-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

Now, update the `/auth/login` route handler to use the `LocalAuthGuard` instead:

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req: any) {
  return req.user;
}
```

#### Logout route

To log out, you can create an additional route that invokes `req.logout()` to clear the user's session. This approach is typical for session-based authentication, but it does not apply to JWTs. It requires Passport's session support (`express-session` together with the `passport.initialize()` and `passport.session()` middleware), which this recipe doesn't set up. Since Passport 0.6, `req.logout()` is asynchronous and requires a callback, so wrap it in a promise:

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/logout')
async logout(@Request() req: any) {
  await new Promise<void>((resolve, reject) =>
    req.logout((err: any) => (err ? reject(err) : resolve())),
  );
}
```

#### JWT functionality

We're ready to move on to the JWT portion of our auth system. Let's review and refine our requirements:

- Allow users to authenticate with username/password, returning a JWT for use in subsequent calls to protected API endpoints. We're well on our way to meeting this requirement. To complete it, we need to write the code that issues a JWT.
- Create API routes that are protected based on the presence of a valid JWT as a bearer token.

Install a couple more packages to support the JWT requirements:

```bash
$ npm install --save @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-jwt
```

The [`@nestjs/jwt`](https://github.com/nestjs/jwt) package is a utility package that helps with JWT manipulation. The `passport-jwt` package is the Passport package that implements the JWT strategy, and `@types/passport-jwt` provides its TypeScript type definitions.

Let's take a closer look at how a `POST /auth/login` request is handled. We've decorated the route with the `LocalAuthGuard`, which invokes the passport-local strategy. This means that:

1. The route handler **will only be invoked if the user has been validated**
2. The `req` parameter will contain a `user` property (populated by Passport during the passport-local authentication flow)

With this in mind, we can now generate a real JWT and return it from this route. To keep our services cleanly modularized, we'll generate the JWT in the `AuthService`. Open the `auth.service.ts` file in the `auth` folder, inject the `JwtService`, and add the `login()` method, as shown:

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

The `JwtService` from `@nestjs/jwt` supplies a `sign()` method that generates our JWT from a subset of the `user` object properties. We return the token as a simple object with a single `access_token` property. We use the `sub` claim to hold our `userId` value, to be consistent with JWT standards.

Next, update the `AuthModule` to import the new dependencies and configure the `JwtModule`.

First, create `constants.ts` in the `auth` folder and add the following code:

```typescript
@@filename(auth/constants)
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
@@switch
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
```

We'll use this to share our key between the JWT signing and verifying steps.

> warning **Warning** **Do not expose this key publicly**. We've done so here to make it clear what the code is doing, but in a production system **you must protect this key** using appropriate measures, such as a secrets vault, an environment variable, or a configuration service.

Now, open `auth.module.ts` in the `auth` folder and update it to look like this:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './local.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './local.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

We configure the `JwtModule` using `register()`, passing in a configuration object. See the [`@nestjs/jwt` README](https://github.com/nestjs/jwt/blob/master/README.md) for more on the Nest `JwtModule`, and the [`jsonwebtoken` usage documentation](https://github.com/auth0/node-jsonwebtoken#usage) for details on the available configuration options.

Now we can update the `/auth/login` route to return a JWT.

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { AuthService } from './auth/auth.service.js';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }
}
@@switch
import { Controller, Dependencies, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { AuthService } from './auth/auth.service.js';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }
}
```

Test the routes using cURL again. You can use any of the `user` objects hard-coded in the `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
```

#### Implementing Passport JWT

We can now address our final requirement: protecting endpoints by requiring a valid JWT on the request. Passport helps here too, with the [passport-jwt](https://github.com/mikenicholson/passport-jwt) strategy for securing RESTful endpoints with JSON Web Tokens. Start by creating a file called `jwt.strategy.ts` in the `auth` folder and add the following code:

```typescript
@@filename(auth/jwt.strategy)
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
@@switch
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

With our `JwtStrategy`, we've followed the same recipe described earlier for all Passport strategies. This strategy requires some initialization, so we pass an options object in the `super()` call. See the [passport-jwt strategy options](https://github.com/mikenicholson/passport-jwt#configure-strategy) for the full list. In our case, these options are:

- `jwtFromRequest`: supplies the method by which the JWT is extracted from the `Request`. We use the standard approach of supplying a bearer token in the `Authorization` header of our API requests. See [extracting the JWT from the request](https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request) for other options.
- `ignoreExpiration`: to be explicit, we set the default `false` value, which delegates the responsibility of ensuring that a JWT has not expired to the Passport module. If our route receives an expired JWT, the request is denied with a `401 Unauthorized` response.
- `secretOrKey`: we use the expedient option of supplying a symmetric secret for signing the token. Other options, such as a PEM-encoded public key, may be more appropriate for production apps (see the [passport-jwt strategy options](https://github.com/mikenicholson/passport-jwt#configure-strategy) for more information). In any case, as cautioned earlier, **do not expose this secret publicly**.

The `validate()` method deserves some discussion. For the JWT strategy, Passport first verifies the JWT's signature and decodes the JSON. It then invokes our `validate()` method, passing the decoded JSON as its single parameter. Based on the way JWT signing works, **we're guaranteed to receive a valid token** that we previously signed and issued to a valid user.

As a result, our `validate()` callback is trivial: it returns an object containing the `userId` and `username` properties. Recall that the value returned from `validate()` becomes the `user` property of the `Request` object.

You can also return an array, where the first value becomes the `user` object and the second value becomes the `authInfo` object (`req.authInfo`).

This approach also leaves room ('hooks', as it were) to inject other business logic into the process. For example, we could do a database lookup in our `validate()` method to extract more information about the user, resulting in a more enriched `user` object being available in our `Request`. This is also the place we may decide to do further token validation, such as looking up the `userId` in a list of revoked tokens, enabling us to perform token revocation. The model we've implemented here in our sample code is a fast, "stateless JWT" model, where each API call is immediately authorized based on the presence of a valid JWT, and a small bit of information about the requester (its `userId` and `username`) is available in our Request pipeline.

Add the new `JwtStrategy` as a provider in the `AuthModule`:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './local.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './local.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

By importing the same secret used when we signed the JWT, we ensure that the **verify** phase performed by Passport and the **sign** phase performed in our `AuthService` use a common secret.

Finally, we define the `JwtAuthGuard` class which extends the built-in `AuthGuard`:

```typescript
@@filename(auth/jwt-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### Implement protected route and JWT strategy guards

We can now implement our protected route and its associated guard.

Open the `app.controller.ts` file and update it as shown below:

```typescript
@@filename(app.controller)
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { AuthService } from './auth/auth.service.js';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
@@switch
import { Controller, Dependencies, Bind, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { LocalAuthGuard } from './auth/local-auth.guard.js';
import { AuthService } from './auth/auth.service.js';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}
```

Once again, we're applying an `AuthGuard`, this time one that invokes the strategy registered under the passport-jwt default name, `jwt`. When our `GET /profile` route is hit, the guard invokes our custom-configured passport-jwt strategy, validates the JWT, and assigns the `user` property to the `Request` object.

Ensure the app is running, and test the routes using cURL.

```bash
$ # GET /profile
$ curl http://localhost:3000/profile
$ # result -> {"message":"Unauthorized","statusCode":401}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # result -> {"userId":1,"username":"john"}
```

In the `AuthModule`, we configured the JWT to expire after 60 seconds. This is likely too short for a real application, and the details of token expiration and refresh are beyond the scope of this article. We chose it to demonstrate an important quality of JWTs and the passport-jwt strategy: if you wait 60 seconds after authenticating before sending a `GET /profile` request, you'll receive a `401 Unauthorized` response. Passport checks the JWT's expiration time automatically, so your application doesn't have to.

This completes our JWT authentication implementation. JavaScript clients (such as Angular, React, or Vue apps) and other clients can now authenticate and communicate securely with our API server.

#### Extending guards

In most cases, using a provided `AuthGuard` class is sufficient. However, you may want to extend the default error handling or authentication logic. To do so, extend the built-in class and override its methods in a subclass.

```typescript
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

In addition to extending the default error handling and authentication logic, you can have authentication go through a chain of strategies. The first strategy to succeed, redirect, or error halts the chain. Authentication failures proceed through each strategy in series, and authentication fails only if all strategies fail.

```typescript
export class JwtAuthGuard extends AuthGuard(['strategy_jwt_1', 'strategy_jwt_2', '...']) { ... }
```

#### Enable authentication globally

If most of your endpoints should be protected by default, you can register the authentication guard as a [global guard](/guards#binding-guards). Instead of using the `@UseGuards()` decorator on each controller, you then flag the routes that should be public.

First, register the `JwtAuthGuard` as a global guard using the following construction (in any module):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

With this in place, Nest will automatically bind `JwtAuthGuard` to all endpoints.

Next, provide a mechanism for declaring routes as public. For this, create a custom decorator using the `SetMetadata` decorator factory function.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

The file above exports two constants: our metadata key, named `IS_PUBLIC_KEY`, and the new decorator itself, named `Public` (you can name it `SkipAuth`, `AllowAnon`, or whatever fits your project).

With the custom `@Public()` decorator in place, you can use it to decorate any method, as follows:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

Lastly, the `JwtAuthGuard` needs to return `true` when the `"isPublic"` metadata is found. For this, use the `Reflector` class (see [putting it all together](/guards#putting-it-all-together) in the Guards chapter).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

#### Request-scoped strategies

The Passport API is based on registering strategies with the global instance of the library. Therefore, strategies are not designed to have request-dependent options or to be dynamically instantiated per request (see [injection scopes](/fundamentals/injection-scopes) to learn more about request-scoped providers). If you configure your strategy to be request-scoped, Nest never instantiates it, since it's not tied to any specific route, and there is no way to determine which "request-scoped" strategies should run for a given request.

However, you can dynamically resolve request-scoped providers within the strategy. For this, use the [module reference](/fundamentals/module-ref) feature.

First, open the `local.strategy.ts` file and inject the `ModuleRef` in the usual way:

```typescript
constructor(private moduleRef: ModuleRef) {
  super({
    passReqToCallback: true,
  });
}
```

> info **Hint** The `ModuleRef` class is imported from the `@nestjs/core` package.

Be sure to set the `passReqToCallback` configuration property to `true`, as shown above.

In the next step, the request instance is used to obtain the current context identifier, instead of generating a new one (see [getting the current sub-tree](/fundamentals/module-ref#getting-current-sub-tree) to learn more about the request context).

Now, inside the `validate()` method of the `LocalStrategy` class, use the `getByRequest()` method of the `ContextIdFactory` class to create a context id based on the request object, and pass this to the `resolve()` call:

```typescript
async validate(
  request: Request,
  username: string,
  password: string,
) {
  const contextId = ContextIdFactory.getByRequest(request);
  // "AuthService" is a request-scoped provider
  const authService = await this.moduleRef.resolve(AuthService, contextId);
  ...
}
```

In the example above, the `resolve()` method asynchronously returns the request-scoped instance of the `AuthService` provider (assuming that `AuthService` is marked as a request-scoped provider).

#### Customize Passport

To customize how the guards call Passport, pass options to the `PassportModule.register()` method. Apart from `defaultStrategy` and `property`, which `@nestjs/passport` uses itself, these options are passed to Passport's `authenticate()` call, so the available options depend on the strategy being implemented. For example:

```typescript
PassportModule.register({ session: true });
```

You can also configure a strategy by passing an options object to `super()` in its constructor. For example, for the local strategy:

```typescript
constructor(private authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
```

See the official [Passport website](http://www.passportjs.org/docs/oauth/) for the available property names.

#### Named strategies

When implementing a strategy, you can name it by passing a second argument to the `PassportStrategy()` function. Otherwise, each strategy uses its default name (e.g., `'jwt'` for the JWT strategy):

```typescript
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
```

You then refer to it with a decorator like `@UseGuards(AuthGuard('myjwt'))`.

#### GraphQL

To use an `AuthGuard` with [GraphQL](/graphql/quick-start), extend the built-in `AuthGuard` class and override the `getRequest()` method.

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

To get the currently authenticated user in your GraphQL resolver, define a `@CurrentUser()` decorator:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

To use the decorator in your resolver, include it as a parameter of your query or mutation:

```typescript
@Query(() => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.usersService.findById(user.id);
}
```

For the passport-local strategy, you also need to add the GraphQL context's arguments to the request body so that Passport can access them for validation. Otherwise, you'll get an `Unauthorized` error.

```typescript
@Injectable()
export class GqlLocalAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    const gqlContext = gqlExecutionContext.getContext();
    const gqlArgs = gqlExecutionContext.getArgs();

    gqlContext.req.body = { ...gqlContext.req.body, ...gqlArgs };
    return gqlContext.req;
  }
}
```
