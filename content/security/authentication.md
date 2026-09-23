### Authentication

Authentication is an **essential** part of most applications. There are many approaches to handling it, and the right one for a project depends on its requirements. This chapter presents an approach that you can adapt to a variety of requirements.

First, the requirements. Clients start by authenticating with a username and password. Once authenticated, the server issues a JWT, which the client sends as a [bearer token](https://tools.ietf.org/html/rfc6750) in the `Authorization` header of subsequent requests to prove authentication. We'll also create a protected route that is accessible only to requests that contain a valid JWT.

We'll start with the first requirement: authenticating a user. We'll then extend that by issuing a JWT. Finally, we'll create a protected route that checks for a valid JWT on the request.

#### Creating an authentication module

Start by generating an `AuthModule` containing an `AuthService` and an `AuthController`. The `AuthService` implements the authentication logic, and the `AuthController` exposes the authentication endpoints.

```bash
$ nest g module auth
$ nest g controller auth
$ nest g service auth
```

The `AuthService` relies on a `UsersService` that encapsulates user operations, so generate that module and service as well:

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

In the `UsersModule`, the only change needed is to add the `UsersService` to the `exports` array of the `@Module()` decorator, so that it is visible outside this module (the `AuthService` will use it shortly).

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

#### Implementing the "Sign in" endpoint

The `AuthService` retrieves a user and verifies the password in its `signIn()` method. In the code below, object rest syntax strips the `password` property from the user object before it is returned. This is common practice when returning user objects, because you don't want to expose sensitive fields such as passwords or other security keys.

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
```

> warning **Warning** A real application must never store passwords in plain text. Instead, use a library such as [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme) with a salted one-way hash algorithm. With that approach, you store only hashed passwords and compare the stored hash against a hashed version of the **incoming** password, so user passwords are never stored or exposed in plain text. To keep the sample app simple, it violates that rule and uses plain text. **Don't do this in your real app.** See the [encryption and hashing](/security/encryption-hashing#hashing) chapter for an example.

Next, update the `AuthModule` to import the `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

With this in place, open the `AuthController` and add a `signIn()` method to it. The client calls this endpoint to authenticate a user. It receives the username and password in the request body and, once the JWT step below is in place, returns a JWT if the credentials are valid.

```typescript
@@filename(auth/auth.controller)
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
```

> info **Hint** In a real application, use a DTO class instead of the `Record<string, any>` type to define the shape of the request body. See the [validation](/application/validation) chapter for more information.

<app-banner-courses-auth></app-banner-courses-auth>

#### JWT token

We're ready to move on to the JWT portion of the auth system. Let's review and refine the requirements:

- Allow users to authenticate with a username and password, returning a JWT for use in subsequent calls to protected API endpoints. The sign-in endpoint is in place; to complete this requirement, we need to write the code that issues a JWT.
- Create API routes that are protected based on the presence of a valid JWT as a bearer token.

Install one additional package to support the JWT requirements:

```bash
$ npm install --save @nestjs/jwt
```

> info **Hint** The [`@nestjs/jwt`](https://github.com/nestjs/jwt) package is a utility package for working with JWTs, including generating and verifying them.

To keep the services cleanly modularized, we'll generate the JWT in the `AuthService`. Open the `auth.service.ts` file in the `auth` folder, inject the `JwtService`, and update the `signIn()` method to generate a JWT as shown below:

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, username: user.username };
    return {
      // 💡 Here the JWT secret key that's used for signing the payload 
      // is the key that was passed in the JwtModule
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      // 💡 Here the JWT secret key that's used for signing the payload 
      // is the key that was passed in the JwtModule
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
```

The `JwtService` from `@nestjs/jwt` supplies a `signAsync()` method, which generates the JWT from a subset of the `user` object properties. We return the token in an object with a single `access_token` property. The `userId` value is stored in the `sub` (subject) claim to be consistent with the JWT standard.

Next, update the `AuthModule` to import the new dependencies and configure the `JwtModule`.

First, create `constants.ts` in the `auth` folder, and add the following code:

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

This constant shares the key between the JWT signing and verifying steps.

> warning **Warning** **Do not expose this key publicly**. It is exposed here only to make it clear what the code is doing. In a production system, **you must protect this key** using appropriate measures such as a secrets vault, environment variable, or configuration service.

Now, open `auth.module.ts` in the `auth` folder and update it to look like this:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { jwtConstants } from './constants.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

> info **Hint** The `JwtModule` is registered as global (`global: true`), so you don't need to import it anywhere else in the application.

The `register()` method takes a configuration object. See the [`@nestjs/jwt` README](https://github.com/nestjs/jwt/blob/master/README.md) for more on the `JwtModule`, and the [`jsonwebtoken` usage docs](https://github.com/auth0/node-jsonwebtoken#usage) for details on the available sign and verify options.

Now test the login route using cURL. You can use any of the `user` objects hard-coded in the `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
```

#### Implementing the authentication guard

We can now address the final requirement: protecting endpoints by requiring a valid JWT on the request. To do so, create an `AuthGuard` that protects routes.

```typescript
@@filename(auth/auth.guard)
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload 
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

Now implement the protected route and bind the `AuthGuard` to it. Open the `auth.controller.ts` file and update it as shown below:

```typescript
@@filename(auth/auth.controller)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

The `AuthGuard` is applied to the `GET /auth/profile` route, so that route is now protected.

Make sure the app is running, and test the routes using cURL.

```bash
$ # GET /auth/profile
$ curl http://localhost:3000/auth/profile
{"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}

$ # GET /auth/profile using the access_token returned in the previous step as a bearer token
$ curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
{"sub":1,"username":"john","iat":...,"exp":...}
```

In the `AuthModule`, the JWT expiration is set to 60 seconds. That is too short for a real application, and the details of token expiration and refresh are beyond the scope of this chapter. The short value demonstrates an important quality of JWTs: if you wait 60 seconds after authenticating before sending a `GET /auth/profile` request, you receive a `401 Unauthorized` response. This is because `verifyAsync()` automatically checks the token's expiration time (the `exp` claim), so your application doesn't have to.

The JWT authentication implementation is now complete. JavaScript clients (such as Angular, React, or Vue apps) and other clients can now authenticate and communicate securely with the API server.

#### Enable authentication globally

If most of your endpoints should be protected by default, you can register the authentication guard as a [global guard](/guards#binding-guards). Instead of using the `@UseGuards()` decorator on each controller, you then flag which routes are public.

First, register the `AuthGuard` as a global guard in any module (for example, the `AuthModule`):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
],
```

With this in place, Nest binds the `AuthGuard` to all endpoints.

Next, provide a mechanism for declaring routes as public. To do so, create a custom decorator with the `SetMetadata()` decorator factory function.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

This file exports two constants: the metadata key, `IS_PUBLIC_KEY`, and the decorator itself, `Public` (you can name it `SkipAuth`, `AllowAnon`, or whatever fits your project).

You can now use the `@Public()` decorator on any route handler:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

Finally, the `AuthGuard` must return `true` when it finds the `"isPublic"` metadata. To read the metadata, use the `Reflector` class (see [Putting it all together](/guards#putting-it-all-together) in the guards chapter).

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload 
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### Passport integration

[Passport](https://github.com/jaredhanson/passport) is the most popular Node.js authentication library, well known in the community and used in many production applications. You can integrate it with a Nest application using the `@nestjs/passport` module.

To learn how, see the [Passport recipe](/recipes/passport).

#### Example

A complete version of the code in this chapter is available in the [19-auth-jwt sample](https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt).
