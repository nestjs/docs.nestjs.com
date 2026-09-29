### Authentication

`@nestjs/authentication` signs users in and tells the rest of your application who they are. It registers a global guard, gives you decorators and an injectable context to read the current user, and ships the parts every sign-in flow needs: server-side sessions, password hashing, email verification and password reset links, TOTP two-factor authentication, magic links, OpenID Connect, access and refresh tokens, and API keys. All of them are built on Node.js built-ins, and they keep their state in your database through a store you write against documented interfaces, with the package's tests to check it. You write what only your application knows: how to load a user, which routes are public, and the endpoints of your sign-in flows.

In this tutorial, you'll add sign-in to the API of an online store for cat food and supplies. By the end, it will:

- Sign customers in with a password, with Google, or with a link sent by email, and keep the web app signed in with a session cookie.
- Confirm customers' email addresses, and let them reset a forgotten password.
- Give the mobile app short-lived bearer tokens and rotating refresh tokens.
- Offer two-factor authentication with an authenticator app, and require it to change an account's email address.
- Let customers see where they are signed in, and sign out everywhere.
- Limit how fast anyone can guess passwords.
- Keep its sessions, tokens and pending links in PostgreSQL, through Drizzle (or TypeORM).
- Let partners' systems and customers' scripts call the API with keys that customers create and revoke.

These are the endpoints you'll build, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/sign-in` | [Add sign-up and sign-in](/security/authentication#add-sign-up-and-sign-in) |
| `POST /auth/email/verify`, `POST /auth/email/verification` | [Verify email addresses](/security/authentication#verify-email-addresses) |
| `POST /auth/password/forgot`, `POST /auth/password/reset` | [Reset forgotten passwords](/security/authentication#reset-forgotten-passwords) |
| `GET /me`, `GET /orders`, `POST /orders` | [Read the current user](/security/authentication#read-the-current-user) |
| `POST /auth/token`, `POST /auth/token/refresh` | [Issue tokens to the mobile app](/security/authentication#issue-tokens-to-the-mobile-app) |
| `POST /auth/mfa/enroll`, `POST /auth/mfa/replace`, `POST /auth/mfa/confirm`, `POST /auth/mfa/verify`, `PATCH /me/email` | [Add two-factor authentication](/security/authentication#add-two-factor-authentication) |
| `GET /auth/oidc/google/login`, `GET /auth/oidc/google/callback` | [Add "Sign in with Google"](/security/authentication#add-sign-in-with-google) |
| `POST /auth/magic-link`, `POST /auth/magic-link/consume` | [Add magic-link sign-in](/security/authentication#add-magic-link-sign-in) |
| `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `POST /auth/sign-out`, `POST /auth/sign-out-everywhere`, `POST /auth/token/revoke` | [Let customers manage their sessions](/security/authentication#let-customers-manage-their-sessions) |
| `POST /auth/api-keys`, `GET /auth/api-keys`, `DELETE /auth/api-keys/:id` | [Issue API keys to partners](/security/authentication#issue-api-keys-to-partners) |

#### Installation

Install the package:

```bash
$ npm i --save @nestjs/authentication
```

Request bodies are validated with whatever your application already uses. Every DTO on this page comes twice, as a class with decorators and as a Zod schema, so pick the style you have and skip the other listing.

The tutorial keeps users in memory, behind a `UsersRepository` class. Replace its method bodies with Prisma, Drizzle, TypeORM, or whatever your application uses; the rest of the code only sees plain `User` objects. The authentication state (sessions, tokens, authenticators, pending links) moves to PostgreSQL in [Keep sessions and tokens in your database](/security/authentication#keep-sessions-and-tokens-in-your-database).

Starting with email verification, the application reads settings and secrets from environment variables. Keep them in a `.env` file during development, and start the application with it:

```bash
$ npm run start:dev -- --env-file .env
```

#### Register the authentication module

The package never reads your users table. It asks your code for a user by id, and your code decides what a user is. Here's the store's user. `emailVerified` records whether the customer proved they own the address; email verification sets it, and placing orders, Google sign-in and magic links depend on it:

```typescript
@@filename(src/users/user)
export type Role = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  /** Whether the owner proved the address to us, e.g. by using a magic link. */
  emailVerified: boolean;
  roles: Role[];
}
```

The repository keeps password hashes to itself. Everything it returns is a `User` without one, so a user can be returned from a route or written to a log without leaking the hash:

```typescript
@@filename(src/users/users.repository)
import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { User } from './user.js';

interface UserRow extends User {
  passwordHash: string | null;
}

/**
 * In-memory stand-in for your data layer (Prisma, Drizzle, TypeORM, ...).
 * Only `User` objects leave this class: password hashes stay inside.
 */
@Injectable()
export class UsersRepository {
  private readonly rows = new Map<string, UserRow>();

  async create(
    email: string,
    { passwordHash = null, emailVerified = false }: { passwordHash?: string | null; emailVerified?: boolean } = {},
  ): Promise<User> {
    const row: UserRow = { id: randomUUID(), email: normalize(email), emailVerified, roles: ['customer'], passwordHash };
    this.rows.set(row.id, row);
    return toUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = this.rows.get(id);
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.findRow(email);
    return row ? toUser(row) : null;
  }

  /** For password sign-in only. */
  async findCredentials(email: string): Promise<{ user: User; passwordHash: string | null } | null> {
    const row = this.findRow(email);
    return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) {
      row.passwordHash = passwordHash;
    }
  }

  async updateEmail(id: string, email: string): Promise<User | null> {
    const row = this.rows.get(id);
    if (!row) {
      return null;
    }
    row.email = normalize(email);
    row.emailVerified = false; // nobody has proven the new address yet
    return toUser(row);
  }

  private findRow(email: string) {
    const normalized = normalize(email);
    return [...this.rows.values()].find((row) => row.email === normalized);
  }
}

// As the package passes addresses to handlers: an accent typed as two code points matches the stored one.
const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();
const toUser = ({ id, email, emailVerified, roles }: UserRow): User => ({ id, email, emailVerified, roles: [...roles] });
```

```typescript
@@filename(src/users/users.module)
import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';

@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
```

Next comes a **credential provider**. A provider looks at an incoming request and returns the user the request proves, or `null` when the request carries no credentials it understands. `SessionCookieProvider` reads the session cookie, loads the session, and passes it to your `validate()` method, which loads the user:

```typescript
@@filename(src/auth/session-auth.provider)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, SessionCookieProvider, type SessionRecord } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class SessionAuth extends SessionCookieProvider<User> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    // Adds this provider to the chain the guard runs for every request.
    registry.registerProvider(this);
  }

  // Called for every request with a live session cookie.
  // Returning null (the user was deleted) ends the session.
  validate(session: SessionRecord) {
    return this.usersRepository.findById(session.userId);
  }
}
```

Providers are ordinary `@Injectable()` classes, so they inject whatever they need, and they register themselves: the constructor hands `this` to `AuthenticationRegistry`, the package's list of providers, which the guard consults. The base class receives `SessionService` through property injection, which is why the constructor lists only `UsersRepository` and the registry. Because `validate()` runs on every authenticated request, a deleted user loses access right away, not when the session expires.

Provide it in a module of your own. `AuthModule` will hold everything this tutorial adds under `src/auth`:

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { SessionAuth } from './session-auth.provider.js';

@Module({
  imports: [UsersModule],
  providers: [SessionAuth],
})
export class AuthModule {}
```

Now register `AuthenticationModule` in the root module, next to `AuthModule`:

```typescript
@@filename(src/app.module)
import { Module } from '@nestjs/common';
import { AuthenticationModule } from '@nestjs/authentication';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    AuthenticationModule.forRoot({
      session: {
        absoluteTtl: '14d', // signed out after 14 days, however active
        idleTtl: '3d', // or after 3 days without a request
      },
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
```

`forRoot()` takes values only: lifetimes, secrets, client ids, the pages your emails link to. No class goes in the options. The credential providers, the handlers that later sections add and the [database store](/security/authentication#keep-sessions-and-tokens-in-your-database) are providers of your own modules, and each registers itself from its constructor, so it lives next to whatever it injects, and the module's options stay plain data. Lifetimes are milliseconds, or strings such as `'15m'` and `'14d'`, up to 100 years. `@nestjs/jwt` counts seconds instead, so a numeric lifetime under a minute logs a warning at startup: `3600` is 3.6 seconds here, not an hour.

At startup, once every provider's constructor has run, the registry locks and logs the chain it will try:

```bash
LOG [AuthenticationModule] AuthenticationRegistry: providers SessionAuth
```

The module also registers a global guard. From now on, **every route requires a signed-in user** and answers `401 Unauthorized` to anyone else. If your application already has routes that must stay open, such as a health check or the product catalog, mark them with `@Public()`, which the next section introduces.

> info **Hint** Sessions are stored in memory until a provider registers a store, and with `NODE_ENV` set to `production` the module refuses to start that way. A [later section](/security/authentication#keep-sessions-and-tokens-in-your-database) moves them to your database.

#### Add sign-up and sign-in

Validate the request bodies first. Sign-up enforces a minimum password length; sign-in doesn't, so that a password set under an older rule still works:

```typescript
@@filename(src/auth/auth.dto)
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

The same rules as Zod schemas, whose inferred types replace the classes. Nest 12.1 validates any [Standard Schema](https://standardschema.dev/) object, from Zod, Valibot or ArkType, through `StandardSchemaValidationPipe`:

```typescript
@@filename(src/auth/auth.schemas)
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(12).max(128),
});
export type SignUpDto = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.email(),
  password: z.string(),
});
export type SignInDto = z.infer<typeof signInSchema>;
```

`PasswordHasher` hashes passwords with scrypt (`crypto.scrypt`, on the libuv threadpool, so it doesn't block the event loop), using OWASP's recommended parameters by default. A service wraps the two things the controller needs:

```typescript
@@filename(src/auth/credentials.service)
import { ConflictException, Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(email: string, password: string): Promise<User> {
    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }
    // The address is unverified: anyone can type any email into a sign-up form.
    return this.usersRepository.create(email, { passwordHash: await this.passwordHasher.hash(password) });
  }

  /** The user, or `null` when the email or the password is wrong. */
  async verify(email: string, password: string): Promise<User | null> {
    const found = await this.usersRepository.findCredentials(email);
    // With no account (or no password), verify() checks a dummy hash, so the
    // response time does not reveal which emails are registered.
    const valid = await this.passwordHasher.verify(password, found?.passwordHash);
    if (!valid || !found?.passwordHash) {
      return null;
    }
    // The cost settings changed since this hash was stored: upgrade it now,
    // while we have the plaintext.
    if (this.passwordHasher.needsRehash(found.passwordHash)) {
      await this.usersRepository.updatePasswordHash(found.user.id, await this.passwordHasher.hash(password));
    }
    return found.user;
  }
}
```

- `verify()` with no stored hash checks the password against a dummy hash. An unknown email and a wrong password take the same time and produce the same answer, so neither reveals which emails have accounts.
- Passwords are hashed with scrypt from `node:crypto`, at the parameters OWASP recommends (N=2^17, r=8, p=1: about 128 MiB of memory per hash), on the libuv thread pool. That's a memory-hard function, which bcrypt isn't, and it needs no native dependency. Every hash records the parameters it was made with (`$scrypt$ln=17,r=8,p=1$...`). When you raise the cost with the `password` option, `needsRehash()` tells you which stored hashes to upgrade, and the only moment you can do that is while the user signs in. The cost has a ceiling of 1 GiB of memory and 16 times the default work per hash, so with `r` at 8, `logN` stops at 20. Parameters beyond it fail at startup, and a stored hash made with them never verifies.
- `register()` leaves the address unverified. Typing an email into a sign-up form doesn't prove you own it.

The controller turns a verified password into a session:

```typescript
@@filename(src/auth/auth.controller)
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Public, SignInService } from '@nestjs/authentication';
import { SignInDto, SignUpDto } from './auth.dto.js';
import { CredentialsService } from './credentials.service.js';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly signInService: SignInService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    const user = await this.credentialsService.register(body.email, body.password);
    await this.signInService.signIn(user.id, { method: 'password' });
    return user;
  }

  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() body: SignInDto) {
    const user = await this.credentialsService.verify(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { session } = await this.signInService.signIn(user.id, { method: 'password' });
    return { mfaRequired: session.mfa === 'pending' };
  }
}
```

`@Public()` on the class skips authentication for both routes. `SignInService.signIn()` is the one place where a first factor becomes a session: this step calls it after a password, and the Google and magic-link steps go through it too. It creates the session and sets the session cookie on the response itself, on Express and Fastify alike, so the controller needs neither `@Req()` nor `@Res()`:

- The cookie, `__Host-sid`, holds a random 256-bit token and is `HttpOnly`, `Secure` and `SameSite=Lax`. The `__Host-` prefix tells browsers to accept it only from this host, so a page on another subdomain can't plant a session cookie of its own. Only the token's SHA-256 hash is stored, so a leaked session store can't be replayed as cookies.
- It deletes the session this browser had before, which defends against session fixation.
- It refuses, with a 403, a sign-in posted from another website's page. Otherwise that page could sign the customer's browser in to an account of the attacker's choosing (login CSRF).
- `method` is recorded in the audit trail, which the section on [managing sessions](/security/authentication#let-customers-manage-their-sessions) mentions.
- `mfaRequired` stays `false` until you [add a second factor](/security/authentication#add-two-factor-authentication).

With the Zod schemas, the body parameters declare their schema instead of a class:

```typescript
@@filename(src/auth/auth.controller)
import { signInSchema, signUpSchema, type SignInDto, type SignUpDto } from './auth.schemas.js';
// ...
@Post('sign-up')
async signUp(@Body({ schema: signUpSchema }) body: SignUpDto) {
  // ...
}

@Post('sign-in')
@HttpCode(200)
async signIn(@Body({ schema: signInSchema }) body: SignInDto) {
  // ...
}
```

Register the controller in `AuthModule`:

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { SessionAuth } from './session-auth.provider.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [SessionAuth, CredentialsService],
})
export class AuthModule {}
```

> info **Hint** The DTOs are enforced only by a validation pipe: bind `ValidationPipe` globally, as an `APP_PIPE` provider of `AppModule` or with `useGlobalPipes()` in `main.ts`. With the Zod schemas, bind `StandardSchemaValidationPipe` the same way instead: an application uses one or the other. The [validation](/application/validation) page has the options of each.

> info **Hint** Chrome, Firefox and curl treat `http://localhost` as a secure origin and accept `Secure` and `__Host-` cookies from it, so you don't need HTTPS during development. On another host over plain HTTP, such as a LAN address, set `cookie.secure` to `false` in the `session` options there; the cookie is then named `sid`.

The session cookie is also protected against cross-site request forgery. Besides `SameSite=Lax`, the module ignores the cookie on `POST`, `PUT`, `PATCH` and `DELETE` requests, and on WebSocket handshakes, that come from another origin, judged by the `Sec-Fetch-Site`, `Origin` and `Host` headers, so those requests are anonymous. Clients that send neither `Sec-Fetch-Site` nor `Origin`, such as curl and your mobile app, are unaffected. If your web app runs on another origin than the API, list it in `session.trustedOrigins`.

On Nest 12.1 or later, also call `app.enableCsrfProtection()` in `main.ts`. It makes the same decision for every route, with a 403, including the public ones that have no session to protect yet. Pass it the same `trustedOrigins` as the `session` options.

#### Verify email addresses

Anyone can type any address into the sign-up form. Until the customer proves the address is theirs, by opening a link sent to it, the store treats it as unverified: it won't take orders whose receipts would go there, and it won't let a Google account or a magic link into that account, as later sections show. The package creates and checks the links. Your application sends them, with the mail library of your choice; the store uses `@nestjs/mail`:

```bash
$ npm i --save @nestjs/mail
```

From this step on, the application reads settings from environment variables. Add the application's public URL to `.env`. The links in the emails point to pages of the web app there:

```bash
APP_URL=http://localhost:3000
```

> info **Hint** The tutorial reads `process.env` directly, to stay short. In an application, load the environment through [`@nestjs/config`](/application/configuration) with a validation schema, so a missing or malformed variable stops the application at startup rather than at the first request, and read the values from `ConfigService`.

Register `MailModule` in `AppModule`. Both modules now read environment variables, so `AuthenticationModule` switches to `forRootAsync()`: its factory runs at bootstrap, whereas the argument of `forRoot()` is evaluated when the file is imported, which was fine while every value was a literal. With `@nestjs/config`, add `inject: [ConfigService]` and read the values from the injected service instead. In development, `LogMailTransport` prints each email to the application's log, so you can follow the links; set `SMTP_URL` to send real email. `FileTemplateEngine` renders the bodies of the emails from HTML files in `src/mail/templates`, one per email:

```typescript
@@filename(src/app.module)
import { FileTemplateEngine, LogMailTransport, MailModule, SmtpTransport } from '@nestjs/mail';
// ...
import { join } from 'node:path';
// ...

@Module({
  imports: [
    MailModule.forRootAsync({
      useFactory: () => ({
        // Your provider in production. In development, each email (links
        // included) is printed to the log.
        transport: process.env.SMTP_URL ? new SmtpTransport({ url: process.env.SMTP_URL }) : new LogMailTransport(),
        // The emails' HTML: the templates in mail/templates, next to this file
        templates: new FileTemplateEngine({ dir: join(import.meta.dirname, 'mail/templates') }),
        from: 'Accounts <accounts@example.com>',
      }),
    }),
    AuthenticationModule.forRootAsync({
      // ...
```

The TypeScript compiler doesn't copy HTML files to `dist`: add the templates to the assets in `nest-cli.json`, as the [Mail](/application/mail#register-the-mail-module) tutorial shows; it covers the template syntax too.

The verification email is a template. The link goes between double braces, which escape it:

```html
@@filename(src/mail/templates/verify-email.html)
<p>Confirm the email address of your store account:</p>
<p><a href="{{ '{' }}{{ '{' }} url {{ '}' }}{{ '}' }}">Confirm my address</a></p>
<p>If you didn't create an account, ignore this email.</p>
```

A mail class renders the email from the template, with the link as its context, and an `EmailVerificationHandler` connects the package to it: `send()` delivers a link, and `markVerified()` records a verified address in your users table. Like a credential provider, a handler registers itself, under the name of the feature it serves:

```typescript
@@filename(src/auth/email-verification.mailer)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, EmailVerificationHandler, type EmailVerificationLink } from '@nestjs/authentication';
import { Mailer, type Mailable } from '@nestjs/mail';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class VerifyEmailMail implements Mailable<EmailVerificationLink> {
  render({ url }: EmailVerificationLink) {
    return {
      subject: 'Confirm your email address',
      template: 'verify-email',
      context: { url },
    };
  }
}

@Injectable()
export class EmailVerificationMailer extends EmailVerificationHandler {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailer: Mailer,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('emailVerification', this);
  }

  async send(link: EmailVerificationLink) {
    await this.mailer.send(VerifyEmailMail, { to: link.email, data: link });
  }

  // Runs when the link is used. It verifies nothing if the address changed since.
  markVerified(userId: string, email: string) {
    return this.usersRepository.markEmailVerified(userId, email);
  }
}
```

`markVerified()` marks only the address the link was sent to. If the customer has changed their address since, the link verifies nothing. The repository updates the row only while the address matches, which in SQL is one conditional update (`UPDATE users SET email_verified = true WHERE id = $1 AND email = $2`):

```typescript
@@filename(src/users/users.repository)
/** Only if `email` is still the user's address: a link sent to an old one verifies nothing. */
async markEmailVerified(id: string, email: string): Promise<boolean> {
  const row = this.rows.get(id);
  if (!row || row.email !== normalize(email)) {
    return false;
  }
  row.emailVerified = true;
  return true;
}
```

A feature has two halves: its handler, and its option. Provide the handler in `AuthModule`, and configure the page the links open. One half without the other fails at startup, with a message naming the missing one:

```typescript
@@filename(src/auth/auth.module)
providers: [
  SessionAuth,
  CredentialsService,
  EmailVerificationMailer,
],
```

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    session: {
      // ...
    },
    emailVerification: { url: `${process.env.APP_URL}/verify-email` },
  }),
}),
```

Send the link when a customer signs up:

```typescript
@@filename(src/auth/auth.controller)
import { EmailVerificationService, Public, SignInService } from '@nestjs/authentication';
// ...
constructor(
  private readonly credentialsService: CredentialsService,
  private readonly signInService: SignInService,
  private readonly emailVerificationService: EmailVerificationService,
) {}

@Post('sign-up')
async signUp(@Body() body: SignUpDto) {
  const user = await this.credentialsService.register(body.email, body.password);
  await this.signInService.signIn(user.id, { method: 'password' });
  // The link in this email proves the customer owns the address.
  await this.emailVerificationService.send(user);
  return user;
}
```

Then add the endpoints. The link opens a page of the web app, which POSTs the token from its URL back to the API: email scanners and link previews follow links in emails with GET requests, and would use it up before the customer clicks.

```typescript
@@filename(src/auth/email-verification.controller)
import { BadRequestException, Body, ConflictException, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser, EmailVerificationService, Public } from '@nestjs/authentication';
import type { User } from '../users/user.js';

@Controller('auth/email')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  // Called by the page the link opens, which POSTs the token from its URL.
  @Public()
  @Post('verify')
  @HttpCode(200)
  async verify(@Body('token') token: string) {
    const verified = await this.emailVerificationService.verify(token);
    if (!verified) {
      throw new BadRequestException('Invalid or expired link');
    }
    return { email: verified.email, emailVerified: true };
  }

  // "Send the link again", to the signed-in customer's current address.
  @Post('verification')
  @HttpCode(202)
  async resend(@CurrentUser() user: User) {
    if (user.emailVerified) {
      throw new ConflictException('Email address already verified');
    }
    await this.emailVerificationService.send(user);
  }
}
```

- `EmailVerificationService.send()` stores the SHA-256 hash of a random 256-bit token, with the customer's id and the address, and passes the link to your handler. The token itself only exists in the email.
- A link works once, for 24 hours (`emailVerification.ttl`), and only for the address it was sent to. `verify()` returns `null` for an unknown, used or expired token, and for an address that has changed since, and the route answers 400.
- `resend` isn't `@Public()`: only a signed-in customer can ask for a new link, and only to their own address, so the route reveals nothing about other accounts.

Register the controller:

```typescript
@@filename(src/auth/auth.module)
controllers: [
  AuthController,
  EmailVerificationController,
],
```

The package can also require a verified address on a route: `@Authenticate()` with `verifiedEmail: true` answers a signed-in customer whose address isn't verified with a 403. [Read the current user](/security/authentication#read-the-current-user) uses it for placing orders.

> info **Hint** `LogMailTransport` logs the text of each email at the `debug` level, links included, so never use it where logs are shipped. In production, set `SMTP_URL`, or pass another transport, such as `ResendTransport`. The [Mail](/application/mail) tutorial covers the options.

#### Reset forgotten passwords

A customer who forgot their password asks for a link, and chooses a new password on the page it opens. The email that sends the link is another template:

```html
@@filename(src/mail/templates/password-reset.html)
<p>Someone asked to reset the password of your store account.</p>
<p><a href="{{ '{' }}{{ '{' }} url {{ '}' }}{{ '}' }}">Choose a new password</a></p>
<p>The link works once, for an hour. If it wasn't you, ignore this email: your password stays as it is.</p>
```

The package owns the tokens; a `PasswordResetHandler` finds accounts, sends the email, and stores the new password's hash:

```typescript
@@filename(src/auth/password-reset.mailer)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, PasswordResetHandler, type PasswordResetLink } from '@nestjs/authentication';
import { Mailer, type Mailable } from '@nestjs/mail';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class PasswordResetMail implements Mailable<PasswordResetLink> {
  render({ url }: PasswordResetLink) {
    return {
      subject: 'Reset your password',
      template: 'password-reset',
      context: { url },
    };
  }
}

@Injectable()
export class PasswordResetMailer extends PasswordResetHandler {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailer: Mailer,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('passwordReset', this);
  }

  // The link goes to the address the account has stored, and works only while
  // the account keeps that address and this hash: any change invalidates it.
  async findUser(email: string) {
    const found = await this.usersRepository.findCredentials(email);
    return found && { id: found.user.id, email: found.user.email, passwordHash: found.passwordHash };
  }

  async send(link: PasswordResetLink) {
    await this.mailer.send(PasswordResetMail, { to: link.email, data: link });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersRepository.updatePasswordHash(userId, passwordHash);
  }
}
```

`findUser()` returns the account's id, its stored address and its stored password hash, `null` for an account without a password. The link goes to that stored address, never to the one typed into the form: a lookup that ignores accents or dots, as MySQL's default collation does, would otherwise mail one customer's link to whoever typed a lookalike address. A link works only while the address and the hash are unchanged, so a password change, by any route, invalidates the links sent before it. Leaving the address or the hash out is an error, which the package logs instead of sending the link.

Enable password reset next to email verification, the handler in `AuthModule` and the page in the options:

```typescript
@@filename(src/auth/auth.module)
providers: [
  SessionAuth,
  CredentialsService,
  EmailVerificationMailer,
  PasswordResetMailer,
],
```

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    // ...
    emailVerification: { url: `${process.env.APP_URL}/verify-email` },
    passwordReset: { url: `${process.env.APP_URL}/reset-password` },
  }),
}),
```

One endpoint takes the address, the other the token and the new password, which follows the sign-up rules:

```typescript
@@filename(src/auth/auth.dto)
// ...

export class EmailDto {
  @IsEmail()
  email: string;
}

/** The token from the reset link, and the new password, under the sign-up rules. */
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
```

```typescript
@@filename(src/auth/auth.schemas)
export const emailSchema = z.object({
  email: z.email(),
});
export type EmailDto = z.infer<typeof emailSchema>;

/** The token from the reset link, and the new password, under the sign-up rules. */
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(12).max(128),
});
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
```

```typescript
@@filename(src/auth/password-reset.controller)
import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PasswordResetService, Public } from '@nestjs/authentication';
import { EmailDto, ResetPasswordDto } from './auth.dto.js';

@Public()
@Controller('auth/password')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  // The same answer, as fast, whether or not the address has an account:
  // request() returns before it looks the address up.
  @Post('forgot')
  @HttpCode(202)
  forgot(@Body() body: EmailDto) {
    this.passwordResetService.request(body.email);
  }

  // Called by the page the link opens, with the token from its URL and the new password.
  @Post('reset')
  @HttpCode(200)
  async reset(@Body() body: ResetPasswordDto) {
    const result = await this.passwordResetService.reset(body.token, body.password, { signIn: true });
    if (!result) {
      throw new BadRequestException('Invalid or expired link');
    }
    return { mfaRequired: result.signedIn?.session.mfa === 'pending' };
  }
}
```

- `request()` returns before it looks the address up. Finding the account, storing the token and sending the email happen after the response, so a request for an address nobody registered gets the same 202, in the same time, as a customer's: the route can't tell anyone who has an account. That's why `forgot` doesn't `await` anything. A failure after the response, such as a mail server that is down, is logged.
- A link works once, for an hour (`passwordReset.ttl`), and only while the account still has the address and the password it had when the link was sent.
- `reset()` stores the new password's hash, invalidates the customer's other reset links, and ends every session and refresh token of the account, so whoever knew the old password is signed out everywhere. [API keys](/security/authentication#issue-api-keys-to-partners) live in your own table and stay valid: to cut them off too, revoke them on the `password-reset` event. A password that `PasswordHasher` refuses, empty or over 4 KiB, gets `null` without spending the link, so the customer can try again. With `signIn: true`, it then signs the customer in on this browser through `SignInService`, so a customer with [two-factor authentication](/security/authentication#add-two-factor-authentication) still has to enter a code.
- The link proves the address too, so `reset()` marks it verified, through your `markVerified()`. That also rescues an account that someone else signed up for with the customer's address: the reset replaces the stranger's password and signs them out.

With the Zod schemas:

```typescript
@@filename(src/auth/password-reset.controller)
import { emailSchema, resetPasswordSchema, type EmailDto, type ResetPasswordDto } from './auth.schemas.js';
// ...
@Post('forgot')
@HttpCode(202)
forgot(@Body({ schema: emailSchema }) body: EmailDto) {
  this.passwordResetService.request(body.email);
}

@Post('reset')
@HttpCode(200)
async reset(@Body({ schema: resetPasswordSchema }) body: ResetPasswordDto) {
  // ...
}
```

Register the controller:

```typescript
@@filename(src/auth/auth.module)
controllers: [
  AuthController,
  EmailVerificationController,
  PasswordResetController,
],
```

#### Read the current user

`@CurrentUser()` injects the user that `validate()` loaded:

```typescript
@@filename(src/users/me.controller)
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import type { User } from './user.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }
}
```

`@CurrentUser('id')` injects a single property. `@CurrentSession()` injects what the provider considers the session: here, the stored session record.

> info **Hint** Optional: tell the package your user type once, and its types follow. Augment the `AuthenticationTypes` interface of `@nestjs/authentication` in a `declare module` block, with `user: User` (the tutorial keeps it in `src/auth/auth-types.ts`). From then on `@CurrentUser('key')` accepts only keys of `User` and is typed to return that property, and `AuthenticationContext.user` and `.session` are typed too. It doesn't type the parameter itself: a parameter decorator has no say over the annotation, so `user: User` stays on the parameter. And it is one user type for the whole application, so an application with two kinds of principal keeps the annotations instead.

```typescript
@@filename(src/users/users.module)
@Module({
  controllers: [MeController],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
```

Controllers aren't the only code that needs the user. Orders belong to the customer who placed them, and `OrdersService` reads that customer from `AuthenticationContext`, so the controller doesn't pass the user down:

```typescript
@@filename(src/orders/order)
export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  /** In cents. */
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'refunded';
}
```

```typescript
@@filename(src/orders/orders.service)
import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthenticationContext } from '@nestjs/authentication';
import type { Order, OrderItem } from './order.js';

// Stand-in for the products table: product id → price in cents.
const PRICES = new Map([
  ['salmon-kibble-2kg', 2499],
  ['clumping-litter-10l', 1599],
]);

@Injectable()
export class OrdersService {
  private readonly orders: Order[] = [];

  constructor(private readonly authenticationContext: AuthenticationContext) {}

  findMine(): Order[] {
    const { id } = this.authenticationContext.requireUser();
    return this.orders.filter((order) => order.userId === id);
  }

  place(items: OrderItem[]): Order {
    const { id: userId } = this.authenticationContext.requireUser();
    const total = items.reduce((sum, item) => sum + this.price(item.productId) * item.quantity, 0);
    const order: Order = { id: randomUUID(), userId, items, total, status: 'pending' };
    this.orders.push(order);
    return order;
  }

  private price(productId: string): number {
    const price = PRICES.get(productId);
    if (price === undefined) {
      throw new BadRequestException(`Unknown product ${productId}`);
    }
    return price;
  }
}
```

```typescript
@@filename(src/orders/orders.controller)
import { Body, Controller, Get, Post } from '@nestjs/common';
import { Authenticate } from '@nestjs/authentication';
import type { OrderItem } from './order.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findMine() {
    return this.ordersService.findMine();
  }

  // Receipts and shipping updates go to the customer's email address,
  // so it must be one they proved.
  @Authenticate({ verifiedEmail: true })
  @Post()
  place(@Body('items') items: OrderItem[]) {
    return this.ordersService.place(items);
  }
}
```

`@Authenticate()` with `verifiedEmail: true` lets only customers with a verified address place orders. Anyone else signed in gets a 403 whose `error` is `email_unverified`, which tells the web app to ask the customer to open the [verification link](/security/authentication#verify-email-addresses), or to send it again. It's a 403 rather than a 401: signing in again wouldn't help. `GET /orders` has no such requirement. By default the guard reads `emailVerified` from the user that `validate()` loaded; your `EmailVerificationHandler` can override `isVerified(user)` if your user type stores it differently.

```typescript
@@filename(src/orders/orders.module)
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

Add `OrdersModule` to the `imports` of `AppModule`:

```typescript
@@filename(src/app.module)
UsersModule,
AuthModule,
OrdersModule,
```

`AuthenticationContext` is a singleton. It reads the current request's user from an `AsyncLocalStorage` that the module opens around each handler, so it's correct in anything the handler calls or awaits, however many requests run at the same time. `requireUser()` returns the user, or throws an `AuthenticationError`, which the module answers with a 401 on any transport. Outside a request, in a queue consumer or a cron job, `AuthenticationContext` is empty, and its `run()` method runs a function as a given user. It's also empty in middleware, guards and exception filters, which run outside the handler.

#### Issue tokens to the mobile app

The store's mobile app authenticates with bearer tokens rather than cookies. It sends a short-lived JWT access token in the `Authorization` header, and renews it with a long-lived refresh token.

Add a signing secret to `.env`. It must be at least 32 bytes. Without it, the application refuses to start, naming the option: `accessToken.key` is required.

```bash
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

The application both issues and verifies the access tokens, so describe them once, with the `accessToken` options. The key signs them, and the issuer, audience and lifetime go into every token and are checked on every request:

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    session: {
      // ...
    },
    accessToken: {
      key: process.env.JWT_SECRET!,
      issuer: 'https://api.example.com',
      audience: 'mobile-app',
      ttl: '15m',
    },
  }),
}),
```

With a secret as the key, tokens are signed with HS256. The second credential provider verifies them. `JwtBearerProvider` reads the `Authorization` header, checks the signature against the `accessToken` key, and `exp`, `iss` and `aud`, and passes the verified claims to your `validate()`:

```typescript
@@filename(src/auth/jwt-auth.provider)
import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<User> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    // The key, issuer and audience come from the `accessToken` options.
    super({ realm: 'store' });
    // Second in the chain, after SessionAuth (order 0).
    registry.registerProvider(this, { order: 1 });
  }

  // Called after the signature and claims checked out.
  // Returning null (the user was deleted) rejects the token.
  validate({ sub }: JwtClaims) {
    return sub ? this.usersRepository.findById(sub) : null;
  }
}
```

> info **Hint** HS256 with a shared secret suits an API that both issues and verifies its tokens. If other services verify them too, make the `accessToken` key an ES256 private key: `JwtAuth` then verifies with its public half, and so can they. To accept tokens from another issuer instead, pass `super()` its `jwks` URL, which must be https (plain http only on localhost), or its public `key`, with `issuer` and `audience`: both are required, because an identity provider signs every client's tokens with the same keys. For tokens without an audience, pass `audience: false` and check the claim that names your client in `validate()`. Add `clockTolerance: '30s'` for another issuer's clock. Keys are PEM text or a `KeyObject`; import a JWK with `createPublicKey()` from `node:crypto`, passing the JWK as `key` and `'jwk'` as `format`. An empty `key` or `jwks`, such as an unset environment variable, fails at startup instead of falling back to the `accessToken` options.

Provide it in `AuthModule`:

```typescript
@@filename(src/auth/auth.module)
providers: [
  SessionAuth,
  JwtAuth,
  CredentialsService,
],
```

For each request, the guard asks the providers in ascending `order`, and the first one that returns a user wins. `SessionAuth` registered with the default order, `0`, and `JwtAuth` asked for `1`, so a request with a session cookie is signed in by `SessionAuth`, and a request with a bearer token, which has no cookie, gets `null` from `SessionAuth` and is handled by `JwtAuth`. The order is given at registration rather than left to the order in which Nest constructs the providers: that one follows the module graph, and changes when a provider moves to another module or an import is added. Two providers asking for the same order fail at startup, naming both. A request with neither gets a 401 whose `WWW-Authenticate` header lists what the providers accept: `Bearer realm="store"`. A token that fails verification gets a 401 that says why, as RFC 6750 describes, for example `error="invalid_token", error_description="token expired"`. That tells the mobile app to refresh.

Now the endpoints that issue tokens:

```typescript
@@filename(src/auth/tokens.controller)
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Public, TokenService } from '@nestjs/authentication';
import { SignInDto } from './auth.dto.js';
import { CredentialsService } from './credentials.service.js';

@Public()
@Controller('auth/token')
export class TokensController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly tokenService: TokenService,
  ) {}

  @Post()
  @HttpCode(200)
  async issue(@Body() body: SignInDto) {
    const user = await this.credentialsService.verify(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.tokenService.issue(user.id, {
      method: 'password',
      // `amr` goes into this access token and into every refreshed one.
      claims: { amr: ['pwd'] },
    });
  }

  // An unknown, expired or reused refresh token gets a 401.
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.tokenService.refresh(refreshToken);
  }
}
```

`TokenService.issue()` signs an access token with the `accessToken` options, starts a refresh token, and returns both, with `expiresIn`, the access token's lifetime in seconds. Refresh tokens are opaque, and stored as hashes. Each one works once: `refresh()` spends it and returns its successor, with a new access token. The successors of one sign-in form a family. If a spent token comes back, two parties hold it, a thief and the app, so the service revokes the whole family and both have to sign in again. A refresh token that is unknown, expired or reused throws `RefreshTokenError`, an `AuthenticationError`, which the module answers with a 401, so `refresh` needs no error handling of its own.

The `amr` claim records how the user signed in, and [two-factor authentication](/security/authentication#add-two-factor-authentication) relies on it. `issue()` stores the `claims` with the refresh-token family, and `refresh()` puts them into every access token it mints, so refreshed tokens describe the same sign-in. Keep facts that can change, such as roles, out of `claims`: they would stay in the tokens for as long as the family lives. `validate()` loads the current user on every request instead.

Register the controller:

```typescript
@@filename(src/auth/auth.module)
controllers: [
  AuthController,
  EmailVerificationController,
  PasswordResetController,
  TokensController,
],
```

#### Add two-factor authentication

Customers can protect their accounts with an authenticator app (time-based one-time passwords, or TOTP). Configure `mfa` in `AppModule`:

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    // ...
    mfa: {
      issuer: 'example.com',
      encryption: { keys: [process.env.TOTP_ENCRYPTION_KEY!] },
    },
  }),
}),
```

The server has to read a TOTP secret back to check codes, so, unlike a password, it can't be hashed. `MfaService` encrypts each secret with AES-256-GCM before it reaches storage, bound to its user, and decrypts it only to verify a code. Anyone holding a copy of your database, but not the key, can't generate codes. The key is required: configuring `mfa` without `encryption` throws at startup. (`encryption: false` stores plaintext on purpose, for tests.) A secret shorter than 128 bits never verifies: `enroll()` makes 160, but secrets imported from another system may be shorter, and their users enroll again.

Add the key to `.env`. A string key must be at least 32 characters of random data:

```bash
# Generate with: openssl rand -base64 32
TOTP_ENCRYPTION_KEY=
```

> info **Hint** To rotate the key, put a new one first in `keys` and keep the old one after it. The first key encrypts, every listed key decrypts, and secrets are re-encrypted with the new key as they're used. Remove the old key once nothing uses it. Keys need no names: each encrypted secret records an id derived from its key.

The MFA endpoints enroll an authenticator, confirm it, and complete a sign-in:

```typescript
@@filename(src/auth/mfa.controller)
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Authenticate, CurrentUser, MfaService, Public, SignInService } from '@nestjs/authentication';
import type { User } from '../users/user.js';

@Controller('auth/mfa')
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly signInService: SignInService,
  ) {}

  // Returns the otpauth:// URI for the web app to show as a QR code,
  // and the secret for people who type it in instead.
  @Post('enroll')
  enroll(@CurrentUser() user: User) {
    return this.mfaService.enroll(user.id, user.email);
  }

  // A new phone. The current authenticator keeps working until /confirm
  // receives a code from the new one.
  @Authenticate({ mfa: true })
  @Post('replace')
  replace(@CurrentUser() user: User) {
    return this.mfaService.enroll(user.id, user.email, { replace: true });
  }

  // The first code proves the authenticator works, and that this browser has
  // it: the session passes the second factor from here on, under a new cookie.
  // Recovery codes are shown once.
  @Post('confirm')
  @HttpCode(200)
  async confirm(@CurrentUser('id') userId: string, @Body('code') code: string) {
    if (!(await this.signInService.confirmMfa(userId, code))) {
      throw new UnauthorizedException('Invalid code');
    }
    return { recoveryCodes: await this.mfaService.generateRecoveryCodes(userId) };
  }

  // Second step of signing in. A pending session counts as signed in
  // nowhere, so the route is public: completeMfa() reads the session cookie.
  @Public()
  @Post('verify')
  @HttpCode(200)
  async verify(@Body('code') code: string | undefined, @Body('recoveryCode') recoveryCode: string | undefined) {
    const issued = await this.signInService.completeMfa({ code, recoveryCode });
    if (!issued) {
      throw new UnauthorizedException('Invalid code');
    }
    return { mfa: issued.session.mfa };
  }
}
```

- `enroll()` stores a new, unconfirmed secret, and returns it with an `otpauth://` URI that the web app shows as a QR code. Once an authenticator is confirmed, `enroll()` refuses to overwrite it and throws `MfaAlreadyEnrolledError`, which the module answers with a 409, `Authenticator already enrolled`. Overwriting it would switch two-factor authentication off until the new one was confirmed.
- `replace` handles a new phone. `enroll()` with `replace: true` stages a second secret, and the current authenticator keeps working until `confirm()` receives a code from the new one. `@Authenticate()` with `mfa: true` makes the route require a verified second factor, so a stolen password alone can't swap in someone else's authenticator.
- `SignInService.confirmMfa()` activates the authenticator once it produces a valid code, so a mistyped secret can't lock anyone out. That code also proves this browser has the authenticator, so the session becomes verified, under a new cookie: the customer can use the routes that require a second factor right away, without signing in again. A confirmation sent with a bearer token, which has no session, only activates the authenticator. The ten recovery codes the route returns are shown only this once, and stored under a slow hash salted with the customer's id, so a copy of the database doesn't reveal them.
- Once an authenticator is confirmed, `SignInService.signIn()` creates **pending** sessions for that user. A pending session isn't signed in anywhere: routes that need a user answer with a 401 and `"error": "mfa_required"`, which tells the web app to ask for a code. That's why `verify` is `@Public()`. `completeMfa()` reads the session from this browser's cookie, checks a code or a recovery code, and rotates the session to a new id with `mfa: 'verified'`, setting the new cookie. A pending session expires after 10 minutes (`mfa.pendingTtl`), not after the 14 days of `session.absoluteTtl`: a pending cookie is half a credential. Verifying the code gives the session its full lifetime.
- `completeMfa()` only acts on the session cookie. A request with a bearer token and no cookie gets a 401.
- Codes are accepted 30 seconds either side of now, and each code works once. After 5 wrong codes in 15 minutes, the account refuses every code, right ones included, until the window passes. Each attempt is counted before it's checked, so sending guesses in parallel doesn't get around the limit.

A verified second factor can also be required for individual routes, which is called step-up authentication. The store requires it to change the email address, since that's how an account is recovered. The new address arrives in the `EmailDto` of [Reset forgotten passwords](/security/authentication#reset-forgotten-passwords). Add the route, with `@Authenticate()`:

```typescript
@@filename(src/users/me.controller)
import { Body, ConflictException, Controller, Get, Patch } from '@nestjs/common';
import { Authenticate, CurrentUser, EmailVerificationService } from '@nestjs/authentication';
import { EmailDto } from '../auth/auth.dto.js';
import type { User } from './user.js';
import { UsersRepository } from './users.repository.js';

@Controller('me')
export class MeController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Get()
  me(@CurrentUser() user: User) {
    return user;
  }

  // The email address is how an account is recovered: changing it needs a
  // session (or token) that passed the second factor.
  @Authenticate({ mfa: true })
  @Patch('email')
  async changeEmail(@CurrentUser('id') userId: string, @Body() body: EmailDto) {
    if (await this.usersRepository.findByEmail(body.email)) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.usersRepository.updateEmail(userId, body.email);
    if (user) {
      // The new address is unverified until the customer uses this link.
      await this.emailVerificationService.send(user);
    }
    return user;
  }
}
```

With the Zod schema:

```typescript
@@filename(src/users/me.controller)
import { emailSchema, type EmailDto } from '../auth/auth.schemas.js';
// ...
@Authenticate({ mfa: true })
@Patch('email')
async changeEmail(@CurrentUser('id') userId: string, @Body({ schema: emailSchema }) body: EmailDto) {
  // ...
}
```

Every route already requires a signed-in user; `@Authenticate()` adjusts how. With `mfa: true`, a cookie session passes once it's verified. A customer who hasn't enrolled an authenticator can't pass it, so the web app asks them to enroll first.

The new address is unverified, so the route sends a verification link to it, and the customer can't place orders until they use it. The links sent to the old address stop working: they verify only the address they were sent to.

The mobile app must not become a way around the second factor, and it can't be: like `signIn()`, `TokenService.issue()` gives a customer with a confirmed authenticator no tokens without a code. It answers 401 with `"error": "mfa_required"`, which tells the app to ask for one. The app then sends the password again, with the code. Add the code to the body:

```typescript
@@filename(src/auth/auth.dto)
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// ...

/** The mobile app's sign-in: a password, and a code once the customer has an authenticator. */
export class TokenRequestDto extends SignInDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  recoveryCode?: string;
}
```

```typescript
@@filename(src/auth/auth.schemas)
/** The mobile app's sign-in: a password, and a code once the customer has an authenticator. */
export const tokenRequestSchema = signInSchema.extend({
  code: z.string().optional(),
  recoveryCode: z.string().optional(),
});
export type TokenRequestDto = z.infer<typeof tokenRequestSchema>;
```

And pass it on as the `secondFactor`:

```typescript
@@filename(src/auth/tokens.controller)
@Post()
@HttpCode(200)
async issue(@Body() body: TokenRequestDto) {
  const user = await this.credentialsService.verify(body.email, body.password);
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }
  return this.tokenService.issue(user.id, {
    method: 'password',
    // `amr` goes into this access token and into every refreshed one.
    claims: { amr: ['pwd'] },
    // Checked only for customers with an authenticator.
    secondFactor: { code: body.code, recoveryCode: body.recoveryCode },
  });
}
```

```typescript
@@filename(src/auth/tokens.controller)
import { tokenRequestSchema, type TokenRequestDto } from './auth.schemas.js';
// ...
@Post()
@HttpCode(200)
async issue(@Body({ schema: tokenRequestSchema }) body: TokenRequestDto) {
  // ...
}
```

A request without a code isn't counted as a failed attempt, so the app can find out whether it needs one. A verified code adds `mfa` to the `amr` claim. `JwtBearerProvider` treats a token whose `amr` contains `mfa`, `otp` or `hwk` as verified, so it passes `mfa: true` routes. Refreshed tokens carry the same `amr` as the sign-in that started their family, so a mobile app that signed in with a code stays verified until its refresh tokens expire or are revoked. `issue()` never takes those three values from your own `claims`: it drops them, with a warning in the log, and adds `mfa` only once it has verified a code, so an application can't mint a verified token by accident.

Register the controller:

```typescript
@@filename(src/auth/auth.module)
controllers: [
  // ...
  TokensController,
  MfaController,
],
```

#### Add "Sign in with Google"

In the Google Cloud console, create an OAuth client ID of type **Web application**, and add this authorized redirect URI (and the production one, when you deploy):

```bash
http://localhost:3000/auth/oidc/google/callback
```

Add the client's credentials to `.env`, next to `APP_URL`:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

The first time someone signs in with Google, your application has to decide which local account that Google account belongs to. Store the link as a (provider, subject) pair, where the subject is Google's stable id for the account. Emails change; subjects don't. Add an identities table to the repository:

```typescript
@@filename(src/users/users.repository)
@Injectable()
export class UsersRepository {
  private readonly rows = new Map<string, UserRow>();
  /** `provider:subject` → user id, e.g. `google:1098...` */
  private readonly identities = new Map<string, string>();

  // ...

  async findByIdentity(provider: string, subject: string): Promise<User | null> {
    const id = this.identities.get(`${provider}:${subject}`);
    return id ? this.findById(id) : null;
  }

  async linkIdentity(id: string, provider: string, subject: string): Promise<User | null> {
    this.identities.set(`${provider}:${subject}`, id);
    return this.findById(id);
  }
```

The package asks an `OidcAccountResolver` for that decision:

```typescript
@@filename(src/auth/account-linker)
import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  OidcAccountResolver,
  type OAuthTokens,
  type OidcProfile,
  type OidcResolveContext,
} from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class AccountLinker extends OidcAccountResolver {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('oidc', this);
  }

  async resolveUser(profile: OidcProfile, _tokens: OAuthTokens, { linkTo }: OidcResolveContext) {
    const linked = await this.usersRepository.findByIdentity(profile.provider, profile.subject);

    // "Connect Google" from the account page: link to the signed-in customer.
    if (linkTo) {
      if (linked && linked.id !== linkTo.id) {
        throw new ConflictException('This Google account belongs to another customer');
      }
      return this.usersRepository.linkIdentity(linkTo.id, profile.provider, profile.subject);
    }

    // A returning Google account: sign in the user it is linked to.
    if (linked) {
      return linked;
    }

    // First visit. Trust only an address Google verified, or anyone could
    // claim any account.
    if (!profile.email || !profile.emailVerified) {
      return null; // 403
    }
    const existing = await this.usersRepository.findByEmail(profile.email);
    if (!existing) {
      const user = await this.usersRepository.create(profile.email, { emailVerified: true });
      return this.usersRepository.linkIdentity(user.id, profile.provider, profile.subject);
    }
    // Link by email only if the account's owner proved the address to us too.
    // Otherwise whoever signed up with it, with a password of their choosing,
    // would share the account with the customer.
    if (!existing.emailVerified) {
      throw new ForbiddenException('Sign in with your password, then connect Google from your account');
    }
    return this.usersRepository.linkIdentity(existing.id, profile.provider, profile.subject);
  }
}
```

Linking by email needs both sides to have verified the address:

- **Google must have verified it** (`profile.emailVerified`). Otherwise, anyone could create a Google account with a customer's address and take over their account at the store. Returning `null` refuses the sign-in with a 403.
- **The store account must have verified it too** (`existing.emailVerified`). Otherwise, someone could sign up first with a customer's address and a password of their choosing, and keep access once the customer signs in with Google. This is called account pre-hijacking. An account created with a password is unverified until its owner opens the [verification link](/security/authentication#verify-email-addresses), or [resets the password](/security/authentication#reset-forgotten-passwords). Until then, it gets a 403 that asks the customer to sign in with their password and connect Google from their account.

Connecting Google to an account the customer is signed in to needs no email match at all. The package calls it a link flow: the web app's "Connect Google" button points to `GET /auth/oidc/google/login?link=true`. The package only starts it for a fully signed-in session, and not from another site's page, which gets a 403: a link attaches whatever Google account is signed in on this browser. On the callback it checks that the same session is still live, then calls `resolveUser()` with `linkTo`, the signed-in user. The resolver links the Google account to them, unless it already belongs to another customer. The session stays as it is, and the browser is redirected to `redirectTo`.

Enable OpenID Connect with the `google()` preset and the URL Google sends the browser back to. `:provider` stands for the provider's name, so one callback route serves every provider you add:

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    // ...
    oidc: {
      // The callback route of OidcController, registered with Google.
      callbackUrl: `${process.env.APP_URL}/auth/oidc/:provider/callback`,
      providers: {
        google: google({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      },
    },
  }),
}),
```

The routes are yours, so they sit with your other routes, under your prefixes, versions and throttling. `OidcService.start()` builds the redirect to Google and `finish()` handles the callback; a controller exposes the two:

```typescript
@@filename(src/auth/oidc.controller)
import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { OidcService, Public } from '@nestjs/authentication';

@Public()
@Controller('auth/oidc')
export class OidcController {
  constructor(private readonly oidcService: OidcService) {}

  // "Sign in with Google" links here. With ?link=true, "Connect Google"
  // links the Google account to the signed-in customer instead.
  @Get(':provider/login')
  @Redirect()
  login(@Param('provider') provider: string, @Query('redirectTo') redirectTo?: string, @Query('link') link?: string) {
    return this.oidcService.start(provider, { redirectTo, link: link === 'true' });
  }

  // Where Google sends the browser back.
  @Get(':provider/callback')
  @Redirect()
  callback(@Param('provider') provider: string, @Query() query: Record<string, string>) {
    return this.oidcService.finish(provider, query);
  }
}
```

- `GET /auth/oidc/google/login?redirectTo=/orders` redirects the browser to Google. The web app's "Sign in with Google" button is a plain link to it. `start()` uses the authorization code flow with PKCE, a `state` and a `nonce`. The login transaction is stored server-side under `state`, and the browser gets a secret whose SHA-256 hash is the `state`, in an `HttpOnly` cookie named `__Host-oidc_tx`, for 10 minutes.
- `GET /auth/oidc/google/callback` is where Google sends the browser back. `finish()` checks that the `state` in the query is the hash of the secret in the browser's cookie (so nobody can finish a login they didn't start in this browser, even with a callback URL read from a log or a browser's history), exchanges the code, verifies the ID token's signature against Google's published keys, and checks its issuer, audience, expiry and nonce. If Google can't be reached, or answers with an endpoint that isn't https, the answer is a 502, not a 401. It then calls `resolveUser()`, signs the user in through `SignInService` (so a customer with an authenticator gets a pending session), and returns the redirect to `redirectTo`, or to `/`. Only relative paths are accepted as `redirectTo`, so the login can't be turned into an open redirect.
- Both read the request and set their cookies through Nest's HTTP adapter, and return what `@Redirect()` expects, so the controller works on Express and Fastify alike, without `@Req()` or `@Res()`.

Register the controller and the resolver in `AuthModule`:

```typescript
@@filename(src/auth/auth.module)
controllers: [
  // ...
  MfaController,
  OidcController,
],
providers: [
  // ...
  PasswordResetMailer,
  AccountLinker,
],
```

The `github()` preset works the same way. `microsoft()` also takes your directory's tenant id as its `tenant` option, next to `clientId` and `clientSecret`: a GUID from the Overview page of the Microsoft Entra admin center, such as `process.env.ENTRA_TENANT_ID`. A domain, or the multi-tenant `common`, `organizations` and `consumers`, fails at startup: for those, Microsoft publishes another issuer than the one asked for, and every sign-in would fail. Add them next to `google` in `providers`, and register the callback URL with each of them, with its name in place of `google`.

#### Add magic-link sign-in

A magic link signs a customer in from their inbox, without a password. The package creates and checks the links; delivering them is up to you, through a `MagicLinkHandler`. The store emails them like the verification links, with a template and a mail class of their own:

```html
@@filename(src/mail/templates/magic-link.html)
<p><a href="{{ '{' }}{{ '{' }} url {{ '}' }}{{ '}' }}">Sign in to the store</a></p>
<p>The link works once, for 15 minutes. If you didn't ask for it, ignore this email.</p>
```

```typescript
@@filename(src/auth/magic-link.mailer)
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticationRegistry, MagicLinkHandler, type MagicLink } from '@nestjs/authentication';
import { Mailer, type Mailable } from '@nestjs/mail';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class MagicLinkMail implements Mailable<MagicLink> {
  render({ url }: MagicLink) {
    return {
      subject: 'Your sign-in link',
      template: 'magic-link',
      context: { url },
    };
  }
}

@Injectable()
export class MagicLinkMailer extends MagicLinkHandler {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mailer: Mailer,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerHandler('magicLink', this);
  }

  async send(link: MagicLink) {
    await this.mailer.send(MagicLinkMail, { to: link.email, data: link });
  }

  // Runs when the link is used, which proves the address. The account returned
  // carries its stored `email`, and signs in only if the link went to that address.
  async resolveUser(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      // Passwordless sign-up. Return null instead to refuse unknown addresses.
      return this.usersRepository.create(email, { emailVerified: true });
    }
    // A password account whose address nobody confirmed: whoever chose that
    // password may not own the address. Resetting the password proves both.
    if (!user.emailVerified) {
      throw new ForbiddenException('Sign in with your password, or reset it');
    }
    return user;
  }
}
```

Enable magic links: the handler in `AuthModule`, and the URL the links point to in the options:

```typescript
@@filename(src/auth/auth.module)
providers: [
  // ...
  AccountLinker,
  MagicLinkMailer,
],
```

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    // ...
    magicLink: { url: `${process.env.APP_URL}/sign-in/magic` },
  }),
}),
```

`MagicLinkService.create()` makes a random 256-bit token, valid for 15 minutes and usable once, and passes the link to your handler. It stores the SHA-256 hash of the token combined with a secret that only this browser's transaction cookie holds (see below), so a link read from a log, or forwarded, finds nothing, even with a forged cookie. With `bindToBrowser: false`, it stores the hash of the token alone. The token is added to the URL as a `token` query parameter, and your code never sees it otherwise.

Point the link at a page of your web app, not at the API. The page reads the token from its URL and POSTs it back. Email scanners and link previews follow links in emails with GET requests, and would use up the token before the customer clicks. The page must be on the same site as the API: requesting a link sets a cookie that the browser sends back with the token.

```typescript
@@filename(src/auth/magic-link.controller)
import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { MagicLinkService, Public } from '@nestjs/authentication';
import { EmailDto } from './auth.dto.js';

@Public()
@Controller('auth/magic-link')
export class MagicLinkController {
  constructor(private readonly magicLinkService: MagicLinkService) {}

  @Post()
  @HttpCode(202)
  async request(@Body() body: EmailDto, @Body('redirectTo') redirectTo?: string) {
    await this.magicLinkService.create(body.email, { redirectTo });
  }

  // Called by the page the link opens, which POSTs the token from its URL.
  @Post('consume')
  @HttpCode(200)
  async consume(@Body('token') token: string) {
    // A link opened in another browser throws MagicLinkError, which the module
    // answers: a 401 telling the customer to open it where they asked for it.
    const result = await this.magicLinkService.consume(token);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired link');
    }
    return { redirectTo: result.redirectTo ?? '/', mfaRequired: result.session.mfa === 'pending' };
  }
}
```

- The request route answers 202 whether or not the address has an account, and the account is only created once the link is used. A request posted from another site's page gets a 403, as a sign-in does: that page could otherwise set this browser's transaction cookie for a link to its author's address, then get the customer to open it (login CSRF).
- `consume()` burns the token, calls `resolveUser()`, and signs the user in through `SignInService`, which sets the cookie, so two-factor authentication still applies. `resolveUser()` returns the account with its stored `email`, and the link signs the account in only if that is the address the link was sent to, compared trimmed, lowercased and in Unicode NFC. A lookup that ignores accents or dots, as MySQL's default collation does, can't hand one mailbox another customer's account: `consume()` returns `null` instead.
- A link works only in the browser that asked for it. `create()` sets a transaction cookie, `__Host-magic_link_tx`, and `consume()` refuses the token without it, before looking anything up: it throws a `MagicLinkError`, and the module answers it with a 401 whose `error` is `not_this_browser` and whose message tells the customer to open the link in the browser they requested it from, or to request a new one here. Otherwise anyone could request a link for their own address and get a customer to open it, which would sign the customer's browser in to the attacker's account (login CSRF). The refused link stays valid in the browser that requested it, and the answer reveals nothing about the token, since a made-up one gets it too. So a customer who asks for a link on the laptop and opens the email on the phone is told to open it on the laptop, or to ask for a new link on the phone, which then works there; an application that would rather let the link itself work on the phone sets `bindToBrowser: false` in the `magicLink` options. Unknown, used and expired links, and addresses the handler refuses, get the controller's one generic answer: `consume()` returns `null` for all of them, and only the `magic-link-refused` event says which it was.
- Using the link proves the address, so accounts created by a link are verified. An account created with a password is different while its address is unverified: the link proves who owns the address now, not who chose the password, so the handler refuses it with a 403 rather than handing a pre-hijacked account to its owner. Once the owner has used the [verification link](/security/authentication#verify-email-addresses), or [reset the password](/security/authentication#reset-forgotten-passwords), magic links work for that account too.
- `redirectTo` survives the round trip only if it's a relative path, such as `/orders`.

With the Zod schema:

```typescript
@@filename(src/auth/magic-link.controller)
import { emailSchema, type EmailDto } from './auth.schemas.js';
// ...
@Post()
@HttpCode(202)
async request(@Body({ schema: emailSchema }) body: EmailDto, @Body('redirectTo') redirectTo?: string) {
  // ...
}
```

Register the controller:

```typescript
@@filename(src/auth/auth.module)
controllers: [
  // ...
  OidcController,
  MagicLinkController,
],
```

#### Let customers manage their sessions

Sessions live on the server, so customers can see where they're signed in and end any of those sessions. To tell those sessions apart, record the browser each one belongs to. `session.metadata` runs whenever a customer signs in, with a password, with Google or with a magic link, and what it returns is stored with the new session:

```typescript
@@filename(src/app.module)
AuthenticationModule.forRootAsync({
  useFactory: () => ({
    session: {
      absoluteTtl: '14d', // signed out after 14 days, however active
      idleTtl: '3d', // or after 3 days without a request
      // Stored with every new session, whichever way the customer signed in.
      metadata: (request) => ({ userAgent: request.headers['user-agent'] }),
    },
    // ...
  }),
}),
```

Then list the sessions, and end them:

```typescript
@@filename(src/auth/sessions.controller)
import { Controller, Delete, Get, HttpCode, NotFoundException, Param, Post, UnauthorizedException } from '@nestjs/common';
import {
  CurrentSession,
  CurrentUser,
  Public,
  SessionService,
  SignInService,
  type SessionRecord,
} from '@nestjs/authentication';

@Controller('auth')
export class SessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly signInService: SignInService,
  ) {}

  @Get('sessions')
  async list(@CurrentUser('id') userId: string, @CurrentSession() current: SessionRecord) {
    const sessions = await this.sessionService.list(userId);
    return sessions.map(({ id, createdAt, lastActiveAt, metadata }) => ({
      id,
      createdAt,
      lastActiveAt,
      userAgent: metadata?.userAgent ?? null,
      current: id === current.id,
    }));
  }

  // revoke() only ends a session of this user: another customer's id is a 404.
  @Delete('sessions/:id')
  @HttpCode(204)
  async revoke(@CurrentUser('id') userId: string, @Param('id') id: string) {
    if (!(await this.sessionService.revoke(id, { userId }))) {
      throw new NotFoundException();
    }
  }

  // Public, so that a session still waiting for its second factor can sign
  // out too. signOut() ends the session in this browser's cookie.
  @Public()
  @Post('sign-out')
  @HttpCode(204)
  async signOut() {
    if (!(await this.signInService.signOut())) {
      throw new UnauthorizedException(); // no session cookie, e.g. a bearer token
    }
  }

  @Post('sign-out-everywhere')
  @HttpCode(204)
  async signOutEverywhere(@CurrentUser('id') userId: string) {
    await this.signInService.signOutEverywhere(userId);
  }
}
```

- Session ids are SHA-256 hashes of the cookie tokens. Showing them to their owner is safe, since a cookie can't be derived from one. `revoke()` takes the user as well as the id, and only ends a session that belongs to them, so an id from the URL can't end another customer's session.
- `sign-out` is `@Public()`, like `verify` in [two-factor authentication](/security/authentication#add-two-factor-authentication), so a customer who never finishes the second factor can still sign out. `signOut()` ends the session in this browser's cookie and clears the cookie. It returns `false` when there was no session, and the route answers 401: a bearer token here signs nothing out.
- `signOutEverywhere()` ends every session and every refresh token of the user, and clears this browser's cookie. Access tokens that were already issued stay valid until they expire, which is why they only last 15 minutes.

The mobile app signs out of one device by revoking its refresh token. Add a route to `TokensController`. `TokenService.revoke()` ends the token's family: the token, its predecessors and its successors:

```typescript
@@filename(src/auth/tokens.controller)
// Signs the mobile app out on this device. Unknown tokens get the same
// answer, as in RFC 7009.
@Post('revoke')
@HttpCode(204)
async revoke(@Body('refreshToken') refreshToken: string) {
  await this.tokenService.revoke(refreshToken);
}
```

Register the controller. This is the finished module, with every credential provider and handler of the tutorial:

```typescript
@@filename(src/auth/auth.module)
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { AccountLinker } from './account-linker.js';
import { AuthController } from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { EmailVerificationController } from './email-verification.controller.js';
import { EmailVerificationMailer } from './email-verification.mailer.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { MagicLinkController } from './magic-link.controller.js';
import { MagicLinkMailer } from './magic-link.mailer.js';
import { MfaController } from './mfa.controller.js';
import { OidcController } from './oidc.controller.js';
import { PasswordResetController } from './password-reset.controller.js';
import { PasswordResetMailer } from './password-reset.mailer.js';
import { SessionAuth } from './session-auth.provider.js';
import { SessionsController } from './sessions.controller.js';
import { TokensController } from './tokens.controller.js';

@Module({
  imports: [UsersModule],
  controllers: [
    AuthController,
    EmailVerificationController,
    PasswordResetController,
    TokensController,
    MfaController,
    OidcController,
    MagicLinkController,
    SessionsController,
  ],
  providers: [
    SessionAuth,
    JwtAuth,
    CredentialsService,
    EmailVerificationMailer,
    PasswordResetMailer,
    AccountLinker,
    MagicLinkMailer,
  ],
})
export class AuthModule {}
```

Rotate the session whenever privileges change, for example after a password change or when a customer becomes staff: `SignInService.rotateSession()` gives this browser's session a new id, and sets the new cookie; `completeMfa()` already does this. It resolves `null`, and sets no cookie, when the browser has no session or lost it meanwhile: a sign-out everywhere, a password reset, or another request that rotated it first.

#### Rate-limit sign-in

`@nestjs/authentication` doesn't limit request rates. That's the job of `@nestjs/throttler`, a separate package:

```bash
$ npm i --save @nestjs/throttler
```

Throttling by IP alone is too coarse for sign-in. It lets one client try passwords for many accounts, and customers behind the same network address share a limit. Track the email and the IP address together wherever the request body names an account:

```typescript
@@filename(src/auth/auth-throttler.guard)
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Per IP everywhere; per (email, IP) where the request body names an account. */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = await super.getTracker(req);
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().normalize('NFC').toLowerCase() : '';
    return email ? `${email}|${ip}` : ip;
  }
}
```

Register `ThrottlerModule` with a default limit of 100 requests a minute, and the guard as a global guard:

```typescript
@@filename(src/app.module)
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, minutes } from '@nestjs/throttler';
import { AuthThrottlerGuard } from './auth/auth-throttler.guard.js';
// ...

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: minutes(1), limit: 100 }]),
    // ...
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) },
    { provide: APP_GUARD, useClass: AuthThrottlerGuard },
  ],
})
export class AppModule {}
```

The guard is registered in the root module, so it runs before the authentication guard. Global guards run in module order, and the root module comes first. That means guessed bearer tokens count against the limit too, rather than only being rejected with a 401.

Finally, tighten the limit on the routes that check a password or send an email. Each `@Throttle()` counts per route, and per email and IP:

```typescript
@@filename(src/auth/auth.controller)
@Throttle({ default: { limit: 5, ttl: minutes(15) } })
@Post('sign-in')
```

```typescript
@@filename(src/auth/tokens.controller)
@Throttle({ default: { limit: 5, ttl: minutes(15) } })
@Post()
```

```typescript
@@filename(src/auth/magic-link.controller)
@Throttle({ default: { limit: 3, ttl: minutes(15) } })
@Post()
```

```typescript
@@filename(src/auth/password-reset.controller)
@Throttle({ default: { limit: 3, ttl: minutes(15) } })
@Post('forgot')
```

`Throttle` and `minutes` are imported from `@nestjs/throttler`. The limits on the routes that send email also keep anyone from flooding a customer's inbox from one address. The two-factor codes don't need a throttle of their own: the package locks an account's codes after 5 failures, from any IP address, route or transport. Neither does `POST /auth/password/reset`: a guessed token costs one lookup, and there are 2^256 of them.

> info **Hint** Behind a load balancer or reverse proxy, every request seems to come from the proxy. Enable `trust proxy`, as described in the throttler's [Proxies](/security/rate-limiting#proxies) section, so the tracker sees client addresses.

#### Keep sessions and tokens in your database

Everything the package stores has lived in memory so far: sessions, refresh tokens, authenticators and recovery codes, and pending links and logins. It's lost on restart, and a second instance of the API wouldn't see it. The package doesn't talk to your database itself. It describes what it stores as six interfaces, `SessionStore`, `RefreshTokenStore`, `MfaStore`, `MagicLinkStore`, `OidcStateStore` and `EmailTokenStore`, and your application implements them with the database access it already has, then registers the implementation.

This step shows that implementation twice, for the two ORMs the family's tutorials use: first with Drizzle, which is the tutorial's path, and then, under "With TypeORM" at the end of the step, the same store for an application whose ORM is TypeORM. Take one of the two.

The store uses PostgreSQL with Drizzle, through [`@nestjs/drizzle`](/data/drizzle), which this step assumes your application already has. `DrizzleModule` opens a `pg` pool from the database's URL and provides the Drizzle database, and it closes the pool when the application shuts down, after the package has finished the work it still had in flight (a reset link on its way out, for instance). Add the URL to `.env`, and register the module in `AppModule`:

```bash
DATABASE_URL=postgres://localhost:5432/store
```

```typescript
@@filename(src/app.module)
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
// ...
@Module({
  imports: [
    // The Drizzle database, on a pg pool the module closes when the application shuts down.
    DrizzleModule.forRootAsync({
      useFactory: () => ({ drizzle, connection: process.env.DATABASE_URL! }),
    }),
    // ...
  ],
})
export class AppModule {}
```

Start with the tables. They're ordinary Drizzle tables in the application's schema, next to your own:

```typescript
@@filename(src/database/schema)
// The store's Drizzle tables. drizzle-kit generates the migrations from this file.
import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

// Authentication state: what DrizzleAuthenticationStore (src/auth) keeps for @nestjs/authentication.
// Tokens, links and sessions are stored by their SHA-256; TOTP secrets arrive encrypted.

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    lastActiveAt: at('last_active_at').notNull(),
    mfa: text('mfa', { enum: ['pending', 'verified'] }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    familyExpiresAt: at('family_expires_at').notNull(),
    usedAt: at('used_at'),
    // A family is revoked when any of its tokens is: that covers a successor saved after the revocation.
    revoked: boolean('revoked').notNull().default(false),
    claims: jsonb('claims').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('refresh_tokens_family_id_idx').on(table.familyId),
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_family_expires_at_idx').on(table.familyExpiresAt),
  ],
);

export const mfaAuthenticators = pgTable('mfa_authenticators', {
  userId: text('user_id').primaryKey(),
  secret: text('secret').notNull(),
  confirmed: boolean('confirmed').notNull(),
  pendingSecret: text('pending_secret'),
  lastUsedStep: integer('last_used_step'),
});

export const mfaRecoveryCodes = pgTable(
  'mfa_recovery_codes',
  {
    userId: text('user_id').notNull(),
    codeHash: text('code_hash').notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.codeHash] })],
);

export const mfaFailures = pgTable(
  'mfa_failures',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id').notNull(),
    failedAt: at('failed_at').notNull(),
  },
  (table) => [
    index('mfa_failures_user_id_failed_at_idx').on(table.userId, table.failedAt),
    index('mfa_failures_failed_at_idx').on(table.failedAt),
  ],
);

export const magicLinks = pgTable(
  'magic_links',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    redirectTo: text('redirect_to'),
  },
  (table) => [index('magic_links_expires_at_idx').on(table.expiresAt)],
);

export const oidcLogins = pgTable(
  'oidc_logins',
  {
    state: text('state').primaryKey(),
    provider: text('provider').notNull(),
    codeVerifier: text('code_verifier').notNull(),
    nonce: text('nonce'),
    redirectTo: text('redirect_to'),
    // Set for "connect your Google account" from a signed-in session.
    linkUserId: text('link_user_id'),
    linkSessionId: text('link_session_id'),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
  },
  (table) => [index('oidc_logins_expires_at_idx').on(table.expiresAt)],
);

export const emailTokens = pgTable(
  'email_tokens',
  {
    id: text('id').primaryKey(),
    purpose: text('purpose', { enum: ['password-reset', 'email-verification'] }).notNull(),
    userId: text('user_id').notNull(),
    email: text('email').notNull(),
    fingerprint: text('fingerprint'),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
  },
  (table) => [
    index('email_tokens_user_id_purpose_idx').on(table.userId, table.purpose),
    index('email_tokens_expires_at_idx').on(table.expiresAt),
  ],
);
```

- Sessions, tokens and links are stored as SHA-256 hashes of the values in the cookies and emails, TOTP secrets arrive encrypted with your key (see [two-factor authentication](/security/authentication#add-two-factor-authentication)), and recovery codes arrive hashed with scrypt. Nothing in these tables can be replayed.
- `revoked` is on each refresh token rather than in a table of families: a family counts as revoked when any of its tokens is. That covers a token saved after the revocation, by a refresh that lost a race.

Generate the migration from the schema, and apply it:

```bash
$ npx drizzle-kit generate --name=authentication
No config path provided, using default 'drizzle.config.ts'
Reading config file '/store/drizzle.config.ts'
8 tables
email_tokens 7 columns 2 indexes 0 fks
magic_links 5 columns 1 indexes 0 fks
mfa_authenticators 5 columns 0 indexes 0 fks
mfa_failures 3 columns 2 indexes 0 fks
mfa_recovery_codes 2 columns 0 indexes 0 fks
oidc_logins 9 columns 1 indexes 0 fks
refresh_tokens 9 columns 3 indexes 0 fks
sessions 7 columns 2 indexes 0 fks

[✓] Your SQL migration file ➜ drizzle/0000_authentication.sql 🚀
$ npx drizzle-kit migrate
No config path provided, using default 'drizzle.config.ts'
Reading config file '/store/drizzle.config.ts'
Using 'pg' driver for database querying
[✓] migrations applied successfully!
```

Now the store. It's a provider like any other: it injects the Drizzle database, implements the six interfaces with Drizzle's query builder, and registers itself with the package's `AuthenticationStorage` from its constructor:

```typescript
@@filename(src/auth/drizzle-authentication.store)
import { Injectable } from '@nestjs/common';
import {
  AuthenticationStorage,
  type EmailTokenPurpose,
  type EmailTokenRecord,
  type EmailTokenStore,
  type MagicLinkRecord,
  type MagicLinkStore,
  type MfaStore,
  type OidcStateStore,
  type OidcTransaction,
  type RefreshTokenRecord,
  type RefreshTokenStore,
  type SessionRecord,
  type SessionStore,
  type TotpRecord,
} from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, gt, isNull, lt, lte, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  emailTokens,
  magicLinks,
  mfaAuthenticators,
  mfaFailures,
  mfaRecoveryCodes,
  oidcLogins,
  refreshTokens,
  sessions,
} from '../database/schema.js';

/**
 * Keeps sessions, refresh tokens, authenticators and pending links in
 * PostgreSQL, through Drizzle. Every method that decides whether something
 * works once is a single conditional statement, so the guarantees hold with
 * any number of API instances.
 */
@Injectable()
export class DrizzleAuthenticationStore
  implements SessionStore, RefreshTokenStore, MfaStore, MagicLinkStore, OidcStateStore, EmailTokenStore
{
  /** Pending links and logins kept per table: anyone can create them. */
  protected readonly maxPending: number = 100_000;

  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({
      sessions: this,
      refreshTokens: this,
      mfa: this,
      magicLinks: this,
      oidcStates: this,
      emailTokens: this,
    });
  }

  // Sessions

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const [row] = await this.db.select().from(sessions).where(eq(sessions.id, id));
    return row && withoutNulls(row);
  }

  async createSession(record: SessionRecord): Promise<void> {
    await this.db.insert(sessions).values(record);
    await this.db.delete(sessions).where(lte(sessions.expiresAt, record.createdAt));
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    // Conditional: a session deleted by a sign-out stays deleted.
    await this.db
      .update(sessions)
      .set({ lastActiveAt })
      .where(and(eq(sessions.id, id), lt(sessions.lastActiveAt, lastActiveAt)));
  }

  // Whether this call deleted it: of two rotations of a session, or a rotation and a sign-out, one wins.
  async deleteSession(id: string): Promise<boolean> {
    const deleted = await this.db.delete(sessions).where(eq(sessions.id, id)).returning({ id: sessions.id });
    return deleted.length > 0;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const rows = await this.db.select().from(sessions).where(eq(sessions.userId, userId));
    return rows.map(withoutNulls);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userId, userId));
  }

  // Refresh tokens

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const [row] = await this.db.select().from(refreshTokens).where(eq(refreshTokens.id, id));
    if (!row) {
      return undefined;
    }
    const { revoked: _, ...token } = row;
    return withoutNulls(token);
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.db.insert(refreshTokens).values(record);
    await this.db.delete(refreshTokens).where(lte(refreshTokens.familyExpiresAt, record.createdAt));
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    // Conditional: of two refreshes with the same token, one updates the row.
    const updated = await this.db
      .update(refreshTokens)
      .set({ usedAt: at })
      .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.usedAt)))
      .returning({ id: refreshTokens.id });
    return updated.length === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.familyId, familyId));
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    const revoked = await this.db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.familyId, familyId), eq(refreshTokens.revoked, true)))
      .limit(1);
    return revoked.length > 0;
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, userId));
  }

  // Authenticators, recovery codes and failed attempts

  async getTotp(userId: string): Promise<TotpRecord | undefined> {
    const [row] = await this.db.select().from(mfaAuthenticators).where(eq(mfaAuthenticators.userId, userId));
    if (!row) {
      return undefined;
    }
    const { userId: _, ...totp } = row;
    return withoutNulls(totp);
  }

  async saveTotp(userId: string, record: TotpRecord | null): Promise<void> {
    if (!record) {
      await this.db.delete(mfaAuthenticators).where(eq(mfaAuthenticators.userId, userId));
      return;
    }
    const values = { secret: record.secret, confirmed: record.confirmed, pendingSecret: record.pendingSecret ?? null };
    await this.db
      .insert(mfaAuthenticators)
      .values({ userId, ...values, lastUsedStep: record.lastUsedStep })
      .onConflictDoUpdate({
        target: mfaAuthenticators.userId,
        // Never lower the claimed step: the record may have been read before a claim.
        set: { ...values, lastUsedStep: sql`greatest(${mfaAuthenticators.lastUsedStep}, excluded.last_used_step)` },
      });
  }

  async claimTotpStep(userId: string, step: number): Promise<boolean> {
    // Conditional: a code's time step is accepted once.
    const claimed = await this.db
      .update(mfaAuthenticators)
      .set({ lastUsedStep: step })
      .where(
        and(
          eq(mfaAuthenticators.userId, userId),
          or(isNull(mfaAuthenticators.lastUsedStep), lt(mfaAuthenticators.lastUsedStep, step)),
        ),
      )
      .returning({ userId: mfaAuthenticators.userId });
    return claimed.length === 1;
  }

  async saveRecoveryCodes(userId: string, hashes: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
      if (hashes.length > 0) {
        await tx.insert(mfaRecoveryCodes).values([...new Set(hashes)].map((codeHash) => ({ userId, codeHash })));
      }
    });
  }

  async consumeRecoveryCode(userId: string, hash: string): Promise<boolean> {
    // Conditional: of two requests with the same code, one deletes the row.
    const consumed = await this.db
      .delete(mfaRecoveryCodes)
      .where(and(eq(mfaRecoveryCodes.userId, userId), eq(mfaRecoveryCodes.codeHash, hash)))
      .returning({ userId: mfaRecoveryCodes.userId });
    return consumed.length === 1;
  }

  countRecoveryCodes(userId: string): Promise<number> {
    return this.db.$count(mfaRecoveryCodes, eq(mfaRecoveryCodes.userId, userId));
  }

  async recordMfaFailure(userId: string, windowMs: number, now: number): Promise<number> {
    // Insert, then count, each committed on its own (no transaction): every attempt
    // counts itself and all those recorded before it.
    await this.db.insert(mfaFailures).values({ userId, failedAt: new Date(now) });
    const failures = await this.countMfaFailures(userId, windowMs, now);
    await this.db.delete(mfaFailures).where(lte(mfaFailures.failedAt, new Date(now - windowMs)));
    return failures;
  }

  countMfaFailures(userId: string, windowMs: number, now: number): Promise<number> {
    return this.db.$count(
      mfaFailures,
      and(eq(mfaFailures.userId, userId), gt(mfaFailures.failedAt, new Date(now - windowMs))),
    );
  }

  async clearMfaFailures(userId: string): Promise<void> {
    await this.db.delete(mfaFailures).where(eq(mfaFailures.userId, userId));
  }

  // Magic links

  async saveMagicLink(record: MagicLinkRecord): Promise<void> {
    await this.db.insert(magicLinks).values(record);
    await this.trim(magicLinks, record.createdAt);
  }

  async consumeMagicLink(id: string): Promise<MagicLinkRecord | undefined> {
    // DELETE … RETURNING: of two requests with the same link, one gets the row.
    const [row] = await this.db.delete(magicLinks).where(eq(magicLinks.id, id)).returning();
    return row && withoutNulls(row);
  }

  // Sign-ins with Google in progress

  async saveOidcState({ link, ...login }: OidcTransaction): Promise<void> {
    await this.db.insert(oidcLogins).values({ ...login, linkUserId: link?.userId, linkSessionId: link?.sessionId });
    await this.trim(oidcLogins, login.createdAt);
  }

  async consumeOidcState(state: string): Promise<OidcTransaction | undefined> {
    const [row] = await this.db.delete(oidcLogins).where(eq(oidcLogins.state, state)).returning();
    if (!row) {
      return undefined;
    }
    const { linkUserId, linkSessionId, ...login } = withoutNulls(row);
    return linkUserId && linkSessionId ? { ...login, link: { userId: linkUserId, sessionId: linkSessionId } } : login;
  }

  // Password reset and email verification links

  async saveEmailToken(record: EmailTokenRecord): Promise<void> {
    await this.db.insert(emailTokens).values(record);
    await this.trim(emailTokens, record.createdAt);
  }

  async consumeEmailToken(id: string, purpose: EmailTokenPurpose): Promise<EmailTokenRecord | undefined> {
    const [row] = await this.db
      .delete(emailTokens)
      .where(and(eq(emailTokens.id, id), eq(emailTokens.purpose, purpose)))
      .returning();
    return row && withoutNulls(row);
  }

  async deleteUserEmailTokens(userId: string, purpose: EmailTokenPurpose): Promise<void> {
    await this.db.delete(emailTokens).where(and(eq(emailTokens.userId, userId), eq(emailTokens.purpose, purpose)));
  }

  /** Deletes what expired, and past `maxPending`, what expires first. */
  private async trim(table: typeof magicLinks | typeof oidcLogins | typeof emailTokens, now: Date) {
    await this.db.delete(table).where(lte(table.expiresAt, now));
    const [cutoff] = await this.db
      .select({ expiresAt: table.expiresAt })
      .from(table)
      .orderBy(desc(table.expiresAt))
      .limit(1)
      .offset(this.maxPending);
    if (cutoff) {
      await this.db.delete(table).where(lte(table.expiresAt, cutoff.expiresAt));
    }
  }
}

/** A row without its NULL columns: the package's records leave optional fields out. */
type WithoutNulls<T> = { [K in keyof T as null extends T[K] ? never : K]: T[K] } & {
  [K in keyof T as null extends T[K] ? K : never]?: Exclude<T[K], null>;
};

function withoutNulls<T extends object>(row: T): WithoutNulls<T> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)) as WithoutNulls<T>;
}
```

Add it to the providers of `AuthModule`, like the credential providers and the handlers. Registering in the constructor is all it takes: Nest creates the provider at startup, before the first request.

```typescript
@@filename(src/auth/auth.module)
import { DrizzleAuthenticationStore } from './drizzle-authentication.store.js';
// ...
providers: [
  // ...
  MagicLinkMailer,
  DrizzleAuthenticationStore,
],
```

At startup, after the chain of providers and the handlers, the module logs where each kind of state lives:

```bash
LOG [AuthenticationModule] AuthenticationRegistry: providers SessionAuth, JwtAuth; handlers EmailVerificationMailer (emailVerification), PasswordResetMailer (passwordReset), MagicLinkMailer (magicLink), AccountLinker (oidc)
LOG [AuthenticationModule] AuthenticationStorage: DrizzleAuthenticationStore
```

- **One provider or several.** `registerSource()` takes the interfaces by name, so one class can implement all six, as here, or several classes can split them: a `RedisSessionStore` that registers `sessions`, and this class registering the other five. A second store for the same name fails at startup, naming both classes.
- **Some methods must be one statement.** Whatever decides that something works only once is a single conditional statement, never a read followed by a write. `touchSession()` updates only a session that still exists, so a request racing a sign-out can't bring the session back. `deleteSession()` resolves whether it deleted the row, so of two rotations of one session, or a rotation and a sign-out, exactly one wins. `markRefreshTokenUsed()`, `claimTotpStep()` and `consumeRecoveryCode()` count the rows they changed, and the three `consume` methods are a `DELETE … RETURNING`. `saveTotp()` keeps the larger time step with `greatest()`, the one place the store writes SQL by hand. `recordMfaFailure()` inserts first and counts second, outside a transaction, so a burst of parallel guesses can't all see a low count. Each method of the store interfaces gives its rule, and the race it prevents, in its doc comment.
- **The tables stay bounded.** Anyone can ask for a magic link or a reset link, so each save deletes what has expired and, past 100,000 pending rows in a table, what expires first. Expired sessions and refresh-token families go as new ones are written.
- **Password reset and email verification keep working unchanged.** Their links are rows in `email_tokens` now, and their mailers still send them through `@nestjs/mail`.
- **Production refuses memory.** With `NODE_ENV` set to `production`, the module won't start while a store that a configured feature uses isn't registered, and names the interfaces to implement. A feature can use more than its own store: every sign-in checks `MfaStore` for an authenticator, even without the `mfa` option, and signing out everywhere or resetting a password ends sessions and refresh tokens alike. A store that none of your configured features uses fails at its first read instead. `allowInMemoryStorage: true` in the module options runs in memory anyway, but then every restart or deploy signs everyone out and forgets enrolled authenticators, and instances don't share any of it.

The package ships its rules as tests. `authenticationStoreContract()` from `@nestjs/authentication/testing` returns test cases that work with any test runner, and `concurrent: true` adds the races: parallel refreshes of one token, parallel uses of one code or link, bursts of failed codes, a sign-out racing a request, parallel deletes of one session, and a rotation racing a sign-out or another rotation. Run them on PGlite and, where the calls really race, on PostgreSQL:

```typescript
@@filename(test/drizzle-authentication.store.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { AuthenticationStorage } from '@nestjs/authentication';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { sql } from 'drizzle-orm';
import { drizzle as nodePostgres, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePostgres } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as pglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { Pool } from 'pg';
import { DrizzleAuthenticationStore } from '../src/auth/drizzle-authentication.store.js';
import { startPostgres } from './support/postgres.js';

type Database = NodePgDatabase;

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

/** The store with a cap of 3 pending entries per table, so the suite can check it. */
class CappedStore extends DrizzleAuthenticationStore {
  protected override readonly maxPending = 3;
}

/** The store on empty tables, registered nowhere: the suite builds its own registry. */
async function emptyStore(db: Database) {
  await db.execute(
    sql`TRUNCATE sessions, refresh_tokens, mfa_authenticators, mfa_recovery_codes, mfa_failures, magic_links, oidc_logins, email_tokens`,
  );
  const store = new CappedStore(db, new AuthenticationStorage());
  return { sessions: store, refreshTokens: store, mfa: store, magicLinks: store, oidcStates: store, emailTokens: store };
}

describe('DrizzleAuthenticationStore on PGlite', () => {
  const client = new PGlite();
  const db = pglite(client) as unknown as Database;
  beforeAll(() => migratePglite(pglite(client), { migrationsFolder }));
  afterAll(() => client.close());

  for (const c of authenticationStoreContract(() => emptyStore(db), { concurrent: true, maxPending: 3 })) {
    it(c.name, c.run);
  }
});

// PostgreSQL on a pool of connections: the concurrency cases race for real.
const { postgres, reason } = await startPostgres();

describe.skipIf(!postgres)(`DrizzleAuthenticationStore on PostgreSQL${reason ? ` (skipped: ${reason})` : ''}`, () => {
  let pool: Pool;
  let db: Database;
  beforeAll(async () => {
    pool = new Pool({ connectionString: await postgres!.createDatabase('authentication_tutorial_store'), max: 10 });
    db = nodePostgres(pool);
    await migrateNodePostgres(db, { migrationsFolder });
  });
  afterAll(async () => {
    await pool?.end();
    postgres!.stop();
  });

  for (const c of authenticationStoreContract(() => emptyStore(db), { concurrent: true, maxPending: 3 })) {
    it(c.name, c.run);
  }
});
```

`CappedStore` lowers the cap on pending rows so that `maxPending: 3` can check it. `startPostgres()` is a test helper that creates a throwaway database on a PostgreSQL server, or skips the PostgreSQL cases without one. A store that reads a row and then writes it back passes the other tests and fails these.

**With TypeORM.** The same store for an application whose ORM is TypeORM, on the same eight tables. Drizzle stays the tutorial's path: take this store instead of the one above, not next to it. The tables are entities, and every column states its type, so that the TypeORM CLI, which loads them without decorator metadata, sees the same schema as the application:

```typescript
@@filename(src/typeorm/authentication.entities)
import type { EmailTokenPurpose, MfaState } from '@nestjs/authentication';
import { Column, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

// The authentication tables, read and written by TypeOrmAuthenticationStore: the same
// tables as the Drizzle schema in src/database/schema.ts. Every column states its type, so
// the entities load the same with or without emitted decorator metadata (the TypeORM CLI
// runs them through tsx, which emits none). Tokens, links and sessions are stored by their
// SHA-256; TOTP secrets arrive encrypted.

/** What a `jsonb` column holds: a column typed `unknown` doesn't fit TypeORM's insert types. */
export type Json = object | string | number | boolean | null;

@Entity('sessions')
@Index('sessions_user_id_idx', ['userId'])
@Index('sessions_expires_at_idx', ['expiresAt'])
export class SessionEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text', name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'last_active_at' })
  lastActiveAt: Date;

  @Column({ type: 'text', nullable: true })
  mfa: MfaState | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, Json> | null;
}

@Entity('refresh_tokens')
@Index('refresh_tokens_family_id_idx', ['familyId'])
@Index('refresh_tokens_user_id_idx', ['userId'])
@Index('refresh_tokens_family_expires_at_idx', ['familyExpiresAt'])
export class RefreshTokenEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text', name: 'family_id' })
  familyId: string;

  @Column({ type: 'text', name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'family_expires_at' })
  familyExpiresAt: Date;

  @Column({ type: 'timestamptz', name: 'used_at', nullable: true })
  usedAt: Date | null;

  // A family is revoked when any of its tokens is: that covers a successor saved after the revocation.
  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  @Column({ type: 'jsonb', nullable: true })
  claims: Record<string, Json> | null;
}

@Entity('mfa_authenticators')
export class MfaAuthenticatorEntity {
  @PrimaryColumn({ type: 'text', name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  secret: string;

  @Column({ type: 'boolean' })
  confirmed: boolean;

  @Column({ type: 'text', name: 'pending_secret', nullable: true })
  pendingSecret: string | null;

  @Column({ type: 'integer', name: 'last_used_step', nullable: true })
  lastUsedStep: number | null;
}

@Entity('mfa_recovery_codes')
export class MfaRecoveryCodeEntity {
  @PrimaryColumn({ type: 'text', name: 'user_id' })
  userId: string;

  @PrimaryColumn({ type: 'text', name: 'code_hash' })
  codeHash: string;
}

@Entity('mfa_failures')
@Index('mfa_failures_user_id_failed_at_idx', ['userId', 'failedAt'])
@Index('mfa_failures_failed_at_idx', ['failedAt'])
export class MfaFailureEntity {
  @PrimaryGeneratedColumn('identity', { type: 'integer', generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'text', name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamptz', name: 'failed_at' })
  failedAt: Date;
}

@Entity('magic_links')
@Index('magic_links_expires_at_idx', ['expiresAt'])
export class MagicLinkEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'text', name: 'redirect_to', nullable: true })
  redirectTo: string | null;
}

@Entity('oidc_logins')
@Index('oidc_logins_expires_at_idx', ['expiresAt'])
export class OidcLoginEntity {
  @PrimaryColumn({ type: 'text' })
  state: string;

  @Column({ type: 'text' })
  provider: string;

  @Column({ type: 'text', name: 'code_verifier' })
  codeVerifier: string;

  @Column({ type: 'text', nullable: true })
  nonce: string | null;

  @Column({ type: 'text', name: 'redirect_to', nullable: true })
  redirectTo: string | null;

  // Set for "connect your Google account" from a signed-in session.
  @Column({ type: 'text', name: 'link_user_id', nullable: true })
  linkUserId: string | null;

  @Column({ type: 'text', name: 'link_session_id', nullable: true })
  linkSessionId: string | null;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}

@Entity('email_tokens')
@Index('email_tokens_user_id_purpose_idx', ['userId', 'purpose'])
@Index('email_tokens_expires_at_idx', ['expiresAt'])
export class EmailTokenEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  purpose: EmailTokenPurpose;

  @Column({ type: 'text', name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  fingerprint: string | null;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}
```

The TypeORM CLI and `TypeOrmModule` share one set of options, in a data source file:

```typescript
@@filename(src/typeorm/data-source)
import { DataSource, type DataSourceOptions } from 'typeorm';
import {
  EmailTokenEntity,
  MagicLinkEntity,
  MfaAuthenticatorEntity,
  MfaFailureEntity,
  MfaRecoveryCodeEntity,
  OidcLoginEntity,
  RefreshTokenEntity,
  SessionEntity,
} from './authentication.entities.js';
import { Authentication1790235914534 } from './migrations/1790235914534-Authentication.js';

/** What the application's TypeOrmModule and the TypeORM CLI share. */
export const dataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    SessionEntity,
    RefreshTokenEntity,
    MfaAuthenticatorEntity,
    MfaRecoveryCodeEntity,
    MfaFailureEntity,
    MagicLinkEntity,
    OidcLoginEntity,
    EmailTokenEntity,
  ],
  migrations: [Authentication1790235914534],
} satisfies DataSourceOptions;

// The TypeORM CLI's data source: `migration:generate` compares the entities with this database.
export default new DataSource(dataSourceOptions);
```

Generate the migration from the entities, against a database with your previous migrations applied, apply it, and check that the entities and the database agree. The CLI needs a TypeScript loader for the data source file; this uses `tsx`:

```bash
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Authentication -d src/typeorm/data-source.ts --pretty
Migration /store/src/typeorm/migrations/1790235914534-Authentication.ts has been generated successfully.
$ npx tsx ./node_modules/typeorm/cli.js migration:run -d src/typeorm/data-source.ts
$ npx tsx ./node_modules/typeorm/cli.js migration:generate src/typeorm/migrations/Check -d src/typeorm/data-source.ts --check
No changes in database schema were found
```

The migration it wrote, `1790235914534-Authentication.ts`, is the `CREATE TABLE` and `CREATE INDEX` statements of the eight tables above, and `migrations` in the data source lists it. Now the store, under the same rules as the Drizzle one:

```typescript
@@filename(src/typeorm/typeorm-authentication.store)
import { Injectable } from '@nestjs/common';
import {
  AuthenticationStorage,
  type EmailTokenPurpose,
  type EmailTokenRecord,
  type EmailTokenStore,
  type MagicLinkRecord,
  type MagicLinkStore,
  type MfaStore,
  type OidcStateStore,
  type OidcTransaction,
  type RefreshTokenRecord,
  type RefreshTokenStore,
  type SessionRecord,
  type SessionStore,
  type TotpRecord,
} from '@nestjs/authentication';
import {
  DataSource,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  Or,
  type EntityTarget,
  type FindOptionsWhere,
  type ObjectLiteral,
} from 'typeorm';
import {
  EmailTokenEntity,
  MagicLinkEntity,
  MfaAuthenticatorEntity,
  MfaFailureEntity,
  MfaRecoveryCodeEntity,
  OidcLoginEntity,
  RefreshTokenEntity,
  SessionEntity,
  type Json,
} from './authentication.entities.js';

/**
 * Keeps sessions, refresh tokens, authenticators and pending links in
 * PostgreSQL, through TypeORM: the Drizzle store above, on the same
 * tables. Every method that decides whether something works once is a
 * single conditional statement, so the guarantees hold with any number of
 * API instances.
 */
@Injectable()
export class TypeOrmAuthenticationStore
  implements SessionStore, RefreshTokenStore, MfaStore, MagicLinkStore, OidcStateStore, EmailTokenStore
{
  /** Pending links and logins kept per table: anyone can create them. */
  protected readonly maxPending: number = 100_000;

  constructor(
    private readonly dataSource: DataSource,
    storage: AuthenticationStorage,
  ) {
    storage.registerSource({
      sessions: this,
      refreshTokens: this,
      mfa: this,
      magicLinks: this,
      oidcStates: this,
      emailTokens: this,
    });
  }

  private get manager() {
    return this.dataSource.manager;
  }

  // Sessions

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const row = await this.manager.findOneBy(SessionEntity, { id });
    return row ? withoutNulls(row) : undefined;
  }

  async createSession(record: SessionRecord): Promise<void> {
    // JSON-safe: the package stores what `session.metadata` returned, as JSON.
    const metadata = (record.metadata ?? null) as Record<string, Json> | null;
    await this.manager.insert(SessionEntity, { ...record, mfa: record.mfa ?? null, metadata });
    await this.manager.delete(SessionEntity, { expiresAt: LessThanOrEqual(record.createdAt) });
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    // Conditional: a session deleted by a sign-out stays deleted.
    await this.manager.update(SessionEntity, { id, lastActiveAt: LessThan(lastActiveAt) }, { lastActiveAt });
  }

  // Whether this call deleted it: of two rotations of a session, or a rotation and a sign-out, one wins.
  async deleteSession(id: string): Promise<boolean> {
    const { affected } = await this.manager.delete(SessionEntity, { id });
    return (affected ?? 0) > 0;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const rows = await this.manager.findBy(SessionEntity, { userId });
    return rows.map(withoutNulls);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.manager.delete(SessionEntity, { userId });
  }

  // Refresh tokens

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.manager.findOneBy(RefreshTokenEntity, { id });
    if (!row) {
      return undefined;
    }
    const { revoked: _, ...token } = row;
    return withoutNulls(token);
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    const claims = (record.claims ?? null) as Record<string, Json> | null;
    await this.manager.insert(RefreshTokenEntity, { ...record, usedAt: record.usedAt ?? null, claims });
    await this.manager.delete(RefreshTokenEntity, { familyExpiresAt: LessThanOrEqual(record.createdAt) });
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    // Conditional: of two refreshes with the same token, one updates the row.
    const { affected } = await this.manager.update(RefreshTokenEntity, { id, usedAt: IsNull() }, { usedAt: at });
    return affected === 1;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.manager.update(RefreshTokenEntity, { familyId }, { revoked: true });
  }

  isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    return this.manager.existsBy(RefreshTokenEntity, { familyId, revoked: true });
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.manager.update(RefreshTokenEntity, { userId }, { revoked: true });
  }

  // Authenticators, recovery codes and failed attempts

  async getTotp(userId: string): Promise<TotpRecord | undefined> {
    const row = await this.manager.findOneBy(MfaAuthenticatorEntity, { userId });
    if (!row) {
      return undefined;
    }
    const { userId: _, ...totp } = row;
    return withoutNulls(totp);
  }

  async saveTotp(userId: string, record: TotpRecord | null): Promise<void> {
    if (!record) {
      await this.manager.delete(MfaAuthenticatorEntity, { userId });
      return;
    }
    // An upsert that never lowers the claimed step: the record may have been read before a
    // claim. GREATEST() over the conflicting row is beyond the upsert API, so this one is SQL.
    await this.manager.query(
      `INSERT INTO mfa_authenticators (user_id, secret, confirmed, pending_secret, last_used_step)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         secret = EXCLUDED.secret,
         confirmed = EXCLUDED.confirmed,
         pending_secret = EXCLUDED.pending_secret,
         last_used_step = GREATEST(mfa_authenticators.last_used_step, EXCLUDED.last_used_step)`,
      [userId, record.secret, record.confirmed, record.pendingSecret ?? null, record.lastUsedStep ?? null],
    );
  }

  async claimTotpStep(userId: string, step: number): Promise<boolean> {
    // Conditional: a code's time step is accepted once.
    const { affected } = await this.manager.update(
      MfaAuthenticatorEntity,
      { userId, lastUsedStep: Or(IsNull(), LessThan(step)) },
      { lastUsedStep: step },
    );
    return affected === 1;
  }

  async saveRecoveryCodes(userId: string, hashes: string[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(MfaRecoveryCodeEntity, { userId });
      if (hashes.length > 0) {
        await manager.insert(MfaRecoveryCodeEntity, [...new Set(hashes)].map((codeHash) => ({ userId, codeHash })));
      }
    });
  }

  async consumeRecoveryCode(userId: string, hash: string): Promise<boolean> {
    // Conditional: of two requests with the same code, one deletes the row.
    const { affected } = await this.manager.delete(MfaRecoveryCodeEntity, { userId, codeHash: hash });
    return affected === 1;
  }

  countRecoveryCodes(userId: string): Promise<number> {
    return this.manager.countBy(MfaRecoveryCodeEntity, { userId });
  }

  async recordMfaFailure(userId: string, windowMs: number, now: number): Promise<number> {
    // Insert, then count, each committed on its own (no transaction): every attempt
    // counts itself and all those recorded before it.
    await this.manager.insert(MfaFailureEntity, { userId, failedAt: new Date(now) });
    const failures = await this.countMfaFailures(userId, windowMs, now);
    await this.manager.delete(MfaFailureEntity, { failedAt: LessThanOrEqual(new Date(now - windowMs)) });
    return failures;
  }

  countMfaFailures(userId: string, windowMs: number, now: number): Promise<number> {
    return this.manager.countBy(MfaFailureEntity, { userId, failedAt: MoreThan(new Date(now - windowMs)) });
  }

  async clearMfaFailures(userId: string): Promise<void> {
    await this.manager.delete(MfaFailureEntity, { userId });
  }

  // Magic links

  async saveMagicLink(record: MagicLinkRecord): Promise<void> {
    await this.manager.insert(MagicLinkEntity, { ...record, redirectTo: record.redirectTo ?? null });
    await this.trim(MagicLinkEntity, record.createdAt);
  }

  async consumeMagicLink(id: string): Promise<MagicLinkRecord | undefined> {
    // DELETE … RETURNING: of two requests with the same link, one gets the row.
    const [row] = await this.deleteReturning(MagicLinkEntity, { id });
    return row && withoutNulls(row);
  }

  // Sign-ins with Google in progress

  async saveOidcState({ link, ...login }: OidcTransaction): Promise<void> {
    await this.manager.insert(OidcLoginEntity, {
      ...login,
      nonce: login.nonce ?? null,
      redirectTo: login.redirectTo ?? null,
      linkUserId: link?.userId ?? null,
      linkSessionId: link?.sessionId ?? null,
    });
    await this.trim(OidcLoginEntity, login.createdAt);
  }

  async consumeOidcState(state: string): Promise<OidcTransaction | undefined> {
    const [row] = await this.deleteReturning(OidcLoginEntity, { state });
    if (!row) {
      return undefined;
    }
    const { linkUserId, linkSessionId, ...login } = withoutNulls(row);
    return linkUserId && linkSessionId ? { ...login, link: { userId: linkUserId, sessionId: linkSessionId } } : login;
  }

  // Password reset and email verification links

  async saveEmailToken(record: EmailTokenRecord): Promise<void> {
    await this.manager.insert(EmailTokenEntity, { ...record, fingerprint: record.fingerprint ?? null });
    await this.trim(EmailTokenEntity, record.createdAt);
  }

  async consumeEmailToken(id: string, purpose: EmailTokenPurpose): Promise<EmailTokenRecord | undefined> {
    const [row] = await this.deleteReturning(EmailTokenEntity, { id, purpose });
    return row && withoutNulls(row);
  }

  async deleteUserEmailTokens(userId: string, purpose: EmailTokenPurpose): Promise<void> {
    await this.manager.delete(EmailTokenEntity, { userId, purpose });
  }

  /** `DELETE … RETURNING *`, as rows of the entity: the query builder returns raw column names. */
  private async deleteReturning<T extends ObjectLiteral>(entity: EntityTarget<T>, where: FindOptionsWhere<T>): Promise<T[]> {
    const { raw } = await this.manager.createQueryBuilder().delete().from(entity).where(where).returning('*').execute();
    const columns = this.dataSource.getMetadata(entity).columns;
    return (raw as Record<string, unknown>[]).map(
      (row) => Object.fromEntries(columns.map((column) => [column.propertyName, row[column.databaseName]])) as T,
    );
  }

  /** Deletes what expired, and past `maxPending`, what expires first. */
  private async trim<T extends { expiresAt: Date }>(entity: EntityTarget<T>, now: Date) {
    await this.manager.delete(entity, { expiresAt: LessThanOrEqual(now) } as FindOptionsWhere<T>);
    const [cutoff] = await this.manager.find(entity, {
      select: { expiresAt: true } as never,
      order: { expiresAt: 'DESC' } as never,
      skip: this.maxPending,
      take: 1,
    });
    if (cutoff) {
      await this.manager.delete(entity, { expiresAt: LessThanOrEqual(cutoff.expiresAt) } as FindOptionsWhere<T>);
    }
  }
}

/** A row without its NULL columns: the package's records leave optional fields out. */
type WithoutNulls<T> = { [K in keyof T as null extends T[K] ? never : K]: T[K] } & {
  [K in keyof T as null extends T[K] ? K : never]?: Exclude<T[K], null>;
};

function withoutNulls<T extends object>(row: T): WithoutNulls<T> {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== null)) as WithoutNulls<T>;
}
```

- **Conditional updates and deletes** put the condition in the criteria of `update()` and `delete()`, with `LessThan()`, `IsNull()` and `Or()`, and read `affected`. Never `save()`: it would write back a session that a sign-out just deleted.
- **`saveTotp()`** keeps the larger time step with `GREATEST()` over the conflicting row, which the upsert API can't express, so it is the one statement written as SQL, through `manager.query()`.
- **The `consume` methods** are the delete query builder with `returning('*')`. It returns raw rows under the database's column names, so `deleteReturning()` maps them back to entity properties through the entity metadata.
- **`recordMfaFailure()`** is two statements on `dataSource.manager`, each committed on its own, and `saveRecoveryCodes()` is the one method inside `dataSource.transaction()`.
- **Use it** in place of the Drizzle store: `TypeOrmModule.forRoot(dataSourceOptions)` in `AppModule` instead of `DrizzleModule`, and `TypeOrmAuthenticationStore` in the providers of `AuthModule` instead of `DrizzleAuthenticationStore`. It injects the `DataSource` that `TypeOrmModule` provides.

The contract suite runs on it unchanged. TypeORM connects through `pg`, so the suite needs a PostgreSQL server and is skipped without one. Two more cases check that the entities and the migration agree (what `migration:generate --check` checks), and that the store registers for all six contracts when provided in a module:

```typescript
@@filename(test/typeorm-authentication.store.e2e-spec)
/**
 * TypeOrmAuthenticationStore against the package's contract suite
 * (`@nestjs/authentication/testing`), on PostgreSQL (the server in
 * SQL_TEST_PG_URL, else a throwaway local cluster; see test/support/postgres.ts),
 * with the migration the TypeORM CLI generated. A pool, so the concurrency
 * cases race for real. Skipped, with the reason, without a server.
 */
import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthenticationModule, AuthenticationStorage } from '@nestjs/authentication';
import { authenticationStoreContract } from '@nestjs/authentication/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../src/typeorm/data-source.js';
import { TypeOrmAuthenticationStore } from '../src/typeorm/typeorm-authentication.store.js';
import { startPostgres } from './support/postgres.js';

/** The store with a cap of 3 pending entries per table, so the suite can check it. */
class CappedStore extends TypeOrmAuthenticationStore {
  protected override readonly maxPending = 3;
}

const { postgres, reason } = await startPostgres();

describe.skipIf(!postgres)(`TypeOrmAuthenticationStore on PostgreSQL${reason ? ` (skipped: ${reason})` : ''}`, () => {
  let dataSource: DataSource;
  let url: string;

  beforeAll(async () => {
    url = await postgres!.createDatabase('authentication_tutorial_typeorm_store');
    dataSource = await new DataSource({ ...dataSourceOptions, url, poolSize: 10 }).initialize();
    await dataSource.runMigrations();
  });
  afterAll(async () => {
    await dataSource?.destroy();
    postgres!.stop();
  });

  /** The store on empty tables, registered nowhere: the suite builds its own registry. */
  async function emptyStore() {
    await dataSource.query(
      'TRUNCATE sessions, refresh_tokens, mfa_authenticators, mfa_recovery_codes, mfa_failures, magic_links, oidc_logins, email_tokens',
    );
    const store = new CappedStore(dataSource, new AuthenticationStorage());
    return { sessions: store, refreshTokens: store, mfa: store, magicLinks: store, oidcStates: store, emailTokens: store };
  }

  for (const c of authenticationStoreContract(emptyStore, { concurrent: true, maxPending: 3 })) {
    it(c.name, c.run);
  }

  it('has a migration that matches the entities (what `migration:generate --check` checks)', async () => {
    const { upQueries } = await dataSource.driver.createSchemaBuilder().log();
    expect(upQueries.map((query) => query.query)).toEqual([]);
  });

  it('registers itself for every contract when provided in a module', async () => {
    const log = vi.spyOn(Logger.prototype, 'log');
    const app = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot({ ...dataSourceOptions, url }), AuthenticationModule.forRoot()],
      providers: [TypeOrmAuthenticationStore],
    }).compile();
    await app.init();
    const storage = app.get(AuthenticationStorage);
    const store = app.get(TypeOrmAuthenticationStore);
    expect([storage.sessions, storage.refreshTokens, storage.mfa, storage.magicLinks, storage.oidcStates, storage.emailTokens]).toEqual(
      Array(6).fill(store),
    );
    expect(log).toHaveBeenCalledWith('AuthenticationStorage: TypeOrmAuthenticationStore');
    log.mockRestore();
    await app.close();
  });
});
```

> info **Hint** Using Prisma? [The store contract](/security/authentication#the-store-contract), after the tutorial, lists what each contract must guarantee and how Prisma expresses the atomic methods. Test your store against the same cases.

#### Issue API keys to partners

Cat shelters and pet shops restock in bulk from their own inventory systems, and some customers reorder with a script. A script can't fill in a sign-in form, and a refresh token that changes with every use is a poor fit for a nightly job. Give them API keys instead: long-lived secrets that a customer creates in the web app and revokes when they're no longer needed. The script sends its key as a bearer token, and acts as the customer who created it.

The package checks the keys, and your database keeps them. Add a table to the schema:

```typescript
@@filename(src/database/schema)
// API keys (src/auth/api-key-auth.provider.ts): the SHA-256 of each key, never the key.
export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    hash: text('hash').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
  },
  (table) => [index('api_keys_user_id_idx').on(table.userId)],
);
```

Generate its migration, and apply it (the output is trimmed):

```bash
$ npx drizzle-kit generate --name=api_keys
...
9 tables
api_keys 5 columns 1 indexes 0 fks
...
[✓] Your SQL migration file ➜ drizzle/0001_api_keys.sql 🚀
$ npx drizzle-kit migrate
...
[✓] migrations applied successfully!
```

The third credential provider extends `ApiKeyProvider`, and does one thing: it finds a key by its id.

```typescript
@@filename(src/auth/api-key-auth.provider)
import { Injectable } from '@nestjs/common';
import { ApiKeyProvider, AuthenticationRegistry } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { apiKeys } from '../database/schema.js';
import type { User } from '../users/user.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class ApiKeyAuth extends ApiKeyProvider<User> {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    // Keys look like cat_<id>_<secret>. The prefix tells secret scanners what they found.
    super({ prefix: 'cat', realm: 'store' });
    // Third in the chain, after SessionAuth and JwtAuth.
    registry.registerProvider(this, { order: 2 });
  }

  // Called with the id part of a key; the provider then checks the hash and the expiry.
  // Returning null (no such key, or its owner was deleted) rejects the key.
  async findKey(id: string) {
    const [key] = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id));
    const user = key && (await this.usersRepository.findById(key.userId));
    return user ? { hash: key.hash, user, expiresAt: key.expiresAt } : null;
  }
}
```

A key reads `cat_<id>_<secret>`: the prefix, a public id of 16 hex characters, and a secret of 256 random bits. `findKey()` looks up the id, and the provider does the rest. It compares the SHA-256 of the whole key with the stored `hash`, in constant time and with the same work for an id that doesn't exist, and refuses the key from `expiresAt` on. A slow hash such as the passwords' scrypt would add nothing here, since nobody guesses 256 random bits, and it would slow down every request. A wrong, expired or revoked key gets a 401 with `error="invalid_token"`, like a bad access token.

`JwtAuth` reads the same `Authorization` header. A JWT always contains two dots and a key contains none, so `JwtAuth` leaves keys to `ApiKeyAuth`, whichever of the two runs first. A request without credentials still gets a single challenge, `Bearer realm="store"`, since both providers use the same realm.

Now the endpoints that create, list and revoke keys:

```typescript
@@filename(src/auth/api-keys.controller)
import { Controller, Delete, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { Authenticate, CurrentUser } from '@nestjs/authentication';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { apiKeys } from '../database/schema.js';
import { ApiKeyAuth } from './api-key-auth.provider.js';
import { SessionAuth } from './session-auth.provider.js';

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

// Managed from the web app, signed in with a session: a key can't create or revoke keys.
@Authenticate({ providers: [SessionAuth] })
@Controller('auth/api-keys')
export class ApiKeysController {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly apiKeyAuth: ApiKeyAuth,
  ) {}

  // The only response that contains the key: the table keeps its hash.
  @Post()
  async create(@CurrentUser('id') userId: string) {
    const { key, id, hash } = this.apiKeyAuth.generate();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ONE_YEAR);
    await this.db.insert(apiKeys).values({ id, userId, hash, createdAt, expiresAt });
    return { id, key, createdAt, expiresAt };
  }

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.db
      .select({ id: apiKeys.id, createdAt: apiKeys.createdAt, expiresAt: apiKeys.expiresAt })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));
  }

  // Revoked from the next request on. Another customer's key is a 404.
  @Delete(':id')
  @HttpCode(204)
  async revoke(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const revoked = await this.db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();
    if (revoked.length === 0) {
      throw new NotFoundException();
    }
  }
}
```

- `generate()` returns the key, its id and its hash. The table stores the id and the hash, so `create` is the only time anyone sees the key. A customer who loses a key revokes it and creates another.
- The controller accepts `SessionAuth` alone, so keys are managed from the web app. Under `providers`, the credentials of any other provider count as none: a leaked key can't create more keys, or revoke its owner's.
- Keys expire after a year, so a forgotten key doesn't work forever. Deleting a key's row revokes it from the next request on.

Register both in `AuthModule`:

```typescript
@@filename(src/auth/auth.module)
import { ApiKeyAuth } from './api-key-auth.provider.js';
import { ApiKeysController } from './api-keys.controller.js';
// ...
controllers: [
  // ...
  SessionsController,
  ApiKeysController,
],
providers: [
  // ...
  DrizzleAuthenticationStore,
  ApiKeyAuth,
],
```

A key signs its owner in on every route that doesn't name its providers, `POST /orders` included. It never counts as a second factor: `PATCH /me/email` answers it with `mfa_required`, as it answers a session that hasn't passed the code. To keep a route to keys, or away from them, list the providers the route accepts in `@Authenticate()`. In a handler, `@CurrentSession()` holds the key's `keyId`, with `method` set to `api-key`, so an audit log can say which key placed an order. Keys that may only read, or only order, are a question of permissions, which is what [`@nestjs/authorization`](/security/authorization) is for.

**With TypeORM.** The table is an entity, next to the store's entities:

```typescript
@@filename(src/typeorm/api-key.entity)
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

// The api_keys table of src/database/schema.ts, for an application on TypeORM.
@Entity('api_keys')
@Index('api_keys_user_id_idx', ['userId'])
export class ApiKeyEntity {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text', name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  hash: string;

  @Column({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}
```

List it in the data source's `entities`, and its migration, generated as for the store's tables, in `migrations`. `findKey()` reads the row through the entity's repository, with `findOneBy()`, and the controller writes it with `insert()` and `delete()`.

#### Try it

Apply the [migrations](/security/authentication#keep-sessions-and-tokens-in-your-database), and start the application with the `.env` file from the previous sections:

```bash
$ npm run start:dev -- --env-file .env
```

In another terminal, sign up. The `-c` flag saves the session cookie to a file, and `-b` sends it with later requests. `--json` (curl 7.82 or later) sends a `POST` with a JSON body. Response headers are trimmed here and below:

```bash
$ curl -i localhost:3000/auth/sign-up -c ada.txt --json '{"email":"ada@example.com","password":"correct horse battery"}'
HTTP/1.1 201 Created
Set-Cookie: __Host-sid=q0L7c...; Max-Age=1209600; Path=/; HttpOnly; Secure; SameSite=Lax
{"id":"7b5d3c2e-...","email":"ada@example.com","emailVerified":false,"roles":["customer"]}
```

The session and the pending verification link are rows in PostgreSQL now. The session's id is the SHA-256 hash of the cookie, and the link's token isn't stored at all:

```bash
$ psql "$DATABASE_URL" -c "SELECT user_id, mfa, metadata FROM sessions" -c "SELECT purpose, email FROM email_tokens"
               user_id                | mfa |          metadata
--------------------------------------+-----+-----------------------------
 7b5d3c2e-...                         |     | {"userAgent": "curl/8.7.1"}
(1 row)

      purpose       |      email
--------------------+-----------------
 email-verification | ada@example.com
(1 row)
```

The verification email appears in the application's log (`LogMailTransport` prints the text of each email):

```bash
LOG [LogMailTransport] "Confirm your email address" to ada@example.com
DEBUG [LogMailTransport] Confirm the email address of your store account:

Confirm my address (http://localhost:3000/verify-email?token=Vb3x...)

If you didn't create an account, ignore this email.
```

The cookie signs Ada in, but her address isn't verified, so she can't place an order yet. Send the token back as the verification page would, and the order goes through. Without the cookie, the API answers 401:

```bash
$ curl localhost:3000/me -b ada.txt
{"id":"7b5d3c2e-...","email":"ada@example.com","emailVerified":false,"roles":["customer"]}

$ curl localhost:3000/orders -b ada.txt --json '{"items":[{"productId":"salmon-kibble-2kg","quantity":1}]}'
{"message":"Email address not verified","error":"email_unverified","statusCode":403}

$ curl localhost:3000/auth/email/verify --json '{"token":"Vb3x..."}'
{"email":"ada@example.com","emailVerified":true}

$ curl localhost:3000/orders -b ada.txt --json '{"items":[{"productId":"salmon-kibble-2kg","quantity":1}]}'
{"id":"f3a1...","userId":"7b5d3c2e-...","items":[{"productId":"salmon-kibble-2kg","quantity":1}],"total":2499,"status":"pending"}

$ curl -i localhost:3000/orders
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="store"
{"message":"Unauthorized","statusCode":401}
```

Sign in as the mobile app, and use the access token. The commands below use [jq](https://jqlang.org/) to extract the tokens:

```bash
$ TOKENS=$(curl -s localhost:3000/auth/token --json '{"email":"ada@example.com","password":"correct horse battery"}')
$ echo $TOKENS
{"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","refreshToken":"Qm4x...","expiresIn":900}
$ ACCESS=$(echo $TOKENS | jq -r .accessToken) REFRESH=$(echo $TOKENS | jq -r .refreshToken)

$ curl localhost:3000/orders -H "Authorization: Bearer $ACCESS"
[{"id":"f3a1...","userId":"7b5d3c2e-...","items":[{"productId":"salmon-kibble-2kg","quantity":1}],"total":2499,"status":"pending"}]
```

A refresh token works once. The second attempt with the same token is treated as theft, and revokes the whole family:

```bash
$ curl localhost:3000/auth/token/refresh --json "{\"refreshToken\":\"$REFRESH\"}"
{"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","refreshToken":"n8Vb...","expiresIn":900}

$ curl localhost:3000/auth/token/refresh --json "{\"refreshToken\":\"$REFRESH\"}"
{"message":"Refresh token reused","error":"Unauthorized","statusCode":401}
```

Turn on two-factor authentication. Add the secret to an authenticator app, and confirm with the code it shows. The code proves this browser has the authenticator, so the session is verified from here on, under a new cookie (`-c` saves it):

```bash
$ curl -X POST localhost:3000/auth/mfa/enroll -b ada.txt
{"secret":"MZXW6YTBOI3DGNJS...","uri":"otpauth://totp/example.com:ada%40example.com?secret=MZXW6YTBOI3DGNJS...&issuer=example.com&algorithm=SHA1&digits=6&period=30"}

$ curl -i localhost:3000/auth/mfa/confirm -b ada.txt -c ada.txt --json '{"code":"492039"}'
HTTP/1.1 200 OK
Set-Cookie: __Host-sid=Kp4w...; Max-Age=1209571; Path=/; HttpOnly; Secure; SameSite=Lax
{"recoveryCodes":["7KQ2M-XR4PB","HT9WC-3MDNA","..."]}
```

> info **Hint** With [oath-toolkit](https://www.nongnu.org/oath-toolkit/) installed, `oathtool --totp -b` followed by the secret prints the current code in the terminal.

Sign in again. The new session is pending until it passes the second factor, and verifying replaces the cookie:

```bash
$ curl localhost:3000/auth/sign-in -b ada.txt -c ada.txt --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"mfaRequired":true}

$ curl localhost:3000/me -b ada.txt
{"message":"Second factor required","error":"mfa_required","statusCode":401}

$ curl localhost:3000/auth/mfa/verify -b ada.txt -c ada.txt --json '{"code":"815224"}'
{"mfa":"verified"}

$ curl -X PATCH localhost:3000/me/email -b ada.txt --json '{"email":"ada.lovelace@example.com"}'
{"id":"7b5d3c2e-...","email":"ada.lovelace@example.com","emailVerified":false,"roles":["customer"]}
```

The new address is unverified, and a verification email goes to it:

```bash
LOG [LogMailTransport] "Confirm your email address" to ada.lovelace@example.com
```

The mobile app is asked for a code too:

```bash
$ curl localhost:3000/auth/token --json '{"email":"ada.lovelace@example.com","password":"correct horse battery"}'
{"message":"Second factor required","error":"mfa_required","statusCode":401}
```

Start a Google sign-in. curl shows the redirect; open the same URL in a browser to complete it, and you land on `/orders`, signed in:

```bash
$ curl -i 'localhost:3000/auth/oidc/google/login?redirectTo=/orders'
HTTP/1.1 302 Found
Set-Cookie: __Host-oidc_tx=Zq8...; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax
Location: https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=...&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Fgoogle%2Fcallback&scope=openid+email+profile&state=pW4c...&code_challenge=...&code_challenge_method=S256&nonce=...
```

Ask for a magic link for a new customer, Grace. The link works only in the browser that asked for it, so keep the cookie the response sets. The email appears in the application's log:

```bash
$ curl -i localhost:3000/auth/magic-link -c grace.txt --json '{"email":"grace@example.com"}'
HTTP/1.1 202 Accepted
Set-Cookie: __Host-magic_link_tx=Vn3p...; Max-Age=900; Path=/; HttpOnly; Secure; SameSite=Lax
```

```bash
LOG [LogMailTransport] "Your sign-in link" to grace@example.com
DEBUG [LogMailTransport] Sign in to the store (http://localhost:3000/sign-in/magic?token=Hq2x...)

The link works once, for 15 minutes. If you didn't ask for it, ignore this email.
```

Send the token back as the page would, with that cookie. Grace gets an account, with a verified address, and a session:

```bash
$ curl localhost:3000/auth/magic-link/consume -b grace.txt -c grace.txt --json '{"token":"Hq2x..."}'
{"redirectTo":"/","mfaRequired":false}

$ curl localhost:3000/me -b grace.txt
{"id":"c41e9a07-...","email":"grace@example.com","emailVerified":true,"roles":["customer"]}
```

Grace runs a cat shelter, whose inventory system reorders litter. Create a key for it from her session, and place an order with the key. The key can't create keys, and once Grace revokes it, it stops working:

```bash
$ API_KEY=$(curl -s -X POST localhost:3000/auth/api-keys -b grace.txt)
$ echo $API_KEY
{"id":"d2cb7a64f3279c6b","key":"cat_d2cb7a64f3279c6b_QiBr...","createdAt":"2026-09-22T10:02:41.067Z","expiresAt":"2027-09-22T10:02:41.067Z"}
$ KEY=$(echo $API_KEY | jq -r .key) KEY_ID=$(echo $API_KEY | jq -r .id)

$ curl localhost:3000/orders -H "Authorization: Bearer $KEY" --json '{"items":[{"productId":"clumping-litter-10l","quantity":20}]}'
{"id":"db8a...","userId":"c41e9a07-...","items":[{"productId":"clumping-litter-10l","quantity":20}],"total":31980,"status":"pending"}

$ curl -X POST localhost:3000/auth/api-keys -H "Authorization: Bearer $KEY"
{"message":"Unauthorized","statusCode":401}

$ curl -i -X DELETE localhost:3000/auth/api-keys/$KEY_ID -b grace.txt
HTTP/1.1 204 No Content

$ curl -i localhost:3000/orders -H "Authorization: Bearer $KEY"
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="store", error="invalid_token", error_description="invalid api key"
{"message":"invalid api key","error":"Unauthorized","statusCode":401}
```

List Ada's sessions, then sign her out everywhere. Her old cookie stops working:

```bash
$ curl localhost:3000/auth/sessions -b ada.txt
[{"id":"eT0r...","createdAt":"2026-09-22T10:02:11.042Z","lastActiveAt":"2026-09-22T10:03:30.518Z","userAgent":"curl/8.7.1","current":true}]

$ curl -i -X POST localhost:3000/auth/sign-out-everywhere -b ada.txt
HTTP/1.1 204 No Content
Set-Cookie: __Host-sid=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax

$ curl localhost:3000/me -b ada.txt
{"message":"Unauthorized","statusCode":401}
```

Ada forgot her password. Ask for a reset link for her address, and for an address nobody registered: both get the same empty 202, and only Ada gets an email:

```bash
$ curl -i localhost:3000/auth/password/forgot --json '{"email":"ada.lovelace@example.com"}'
HTTP/1.1 202 Accepted

$ curl -i localhost:3000/auth/password/forgot --json '{"email":"nobody@example.com"}'
HTTP/1.1 202 Accepted
```

```bash
LOG [LogMailTransport] "Reset your password" to ada.lovelace@example.com
DEBUG [LogMailTransport] Someone asked to reset the password of your store account.

Choose a new password (http://localhost:3000/reset-password?token=Rt7k...)

The link works once, for an hour. If it wasn't you, ignore this email: your password stays as it is.
```

Choose a new password with the token, as the reset page would. Ada is signed in again, pending her second factor (a pending session lives ten minutes, `mfa.pendingTtl`, hence the `Max-Age`), and the old password no longer works:

```bash
$ curl -i localhost:3000/auth/password/reset -c ada.txt --json '{"token":"Rt7k...","password":"a brand new passphrase"}'
HTTP/1.1 200 OK
Set-Cookie: __Host-sid=Yb2d...; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax
{"mfaRequired":true}

$ curl localhost:3000/auth/sign-in --json '{"email":"ada.lovelace@example.com","password":"correct horse battery"}'
{"message":"Invalid email or password","error":"Unauthorized","statusCode":401}
```

Finally, guess Grace's password. The sixth attempt within 15 minutes is refused before the password is checked:

```bash
$ for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code} ' localhost:3000/auth/sign-in --json '{"email":"grace@example.com","password":"password123"}'; done
401 401 401 401 401 429
```

#### GraphQL and WebSockets

The global guard, `@Public()`, `@CurrentUser()` and `AuthenticationContext` work in GraphQL resolvers and WebSocket gateways too. The guard reads the cookie and the headers from the request that carries them.

In GraphQL, that's the `req` on the GraphQL context, so the `context` option must be a function that builds a context for each request. A `context` given as an object would be one object for every request, and the app fails at startup. Nest runs global guards and interceptors on root resolvers only: to guard field resolvers too, and to give them `AuthenticationContext`, add `fieldResolverEnhancers: ['guards', 'interceptors']`.

```typescript
@@filename(src/app.module)
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
  subscriptions: { 'graphql-ws': true },
  // Over graphql-ws there is no request per operation: the upgrade request stands in for it.
  context: ({ req, res, extra }) => ({ req: req ?? extra?.request, res }),
  fieldResolverEnhancers: ['guards', 'interceptors'],
}),
```

Over `graphql-ws`, every operation on a socket shares that upgrade request, and each operation that needs a user authenticates again with its cookie, so a sign-out everywhere stops the next one. `@CurrentUser()` gives each operation its own user, and `null` to a `@Public()` one. `req.user`, which the module also sets for code that reads the request, holds whichever operation authenticated last: read `@CurrentUser()` instead.

Nest runs no guards on a gateway's `handleConnection()`, so authenticate the handshake with `WsAuthenticator`:

```typescript
@@filename(src/orders/orders.gateway)
import type { IncomingMessage } from 'node:http';
import { WebSocketGateway, type OnGatewayConnection } from '@nestjs/websockets';
import { WsAuthenticator } from '@nestjs/authentication';
import type { WebSocket } from 'ws';

@WebSocketGateway()
export class OrdersGateway implements OnGatewayConnection {
  constructor(private readonly wsAuthenticator: WsAuthenticator) {}

  async handleConnection(client: WebSocket, request: IncomingMessage) {
    await this.wsAuthenticator.authenticateConnection(client, request);
  }
}
```

It closes a connection that nobody signed in on, with code 1008, or socket.io's `disconnect()`; to keep guests, pass `authenticateConnection()` a third argument whose `required` option is `false`. With socket.io, it reads the handshake's headers, so the `request` argument can go. A handshake from another site's page is anonymous, as a [cross-origin write](/security/authentication#add-sign-up-and-sign-in) is. The guard then authenticates every message again, so a revoked session stops working mid-connection. `@CurrentUser()` is per message, `null` on a `@Public()` one. `client.user` holds the user of the last message that authenticated, and is cleared once a message is refused for its credentials.

[`@nestjs/authorization`](/security/authorization) checks `@Can()` against the user of each message and each operation, not the socket's.

#### Testing

End-to-end tests boot the real `AppModule`, with three things changed. The database is [PGlite](https://pglite.dev), PostgreSQL compiled to WebAssembly, with your real migrations applied, so the tests need no server. Mail goes to an `InMemoryMailTransport`, which keeps each email for the test to read. And scrypt is slow on purpose, a few hundred milliseconds and 128 MiB of memory per hash at the default cost, so the test overrides `PasswordHasher` with a cheaper one. The application also reads its settings at bootstrap, so the tests need test values for them:

```typescript
@@filename(vitest.config.e2e)
export default defineConfig({
  // ...
  test: {
    // ...
    env: {
      APP_URL: 'http://localhost:3000',
      JWT_SECRET: 'test-only-jwt-secret-of-at-least-32-bytes',
      TOTP_ENCRYPTION_KEY: 'test-only-totp-key-of-at-least-32-chars',
      GOOGLE_CLIENT_ID: 'store.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'test-only-google-secret',
    },
  },
});
```

```typescript
@@filename(test/auth.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PGlite } from '@electric-sql/pglite';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { InMemoryMailTransport, MailTransport } from '@nestjs/mail';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { VerifyEmailMail } from '../src/auth/email-verification.mailer.js';
import { PasswordResetMail } from '../src/auth/password-reset.mailer.js';

describe('Authentication (e2e)', () => {
  const pglite = new PGlite(); // PostgreSQL in-process: no server to start
  const mailbox = new InMemoryMailTransport();
  let app: INestApplication;
  const ada = { email: 'ada@example.com', password: 'correct horse battery' };

  beforeAll(async () => {
    const db = drizzle(pglite);
    // The app's migrations, the authentication tables included.
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken()) // the database DrizzleModule provides
      .useValue(db)
      .overrideProvider(MailTransport)
      .useValue(mailbox)
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
    await pglite.close();
  });

  it('signs up, verifies the address, then reads the profile with the session cookie', async () => {
    const res = await request(app.getHttpServer()).post('/auth/sign-up').send(ada).expect(201);
    const cookie = res.headers['set-cookie'][0].split(';')[0];

    const mail = mailbox.assertSent({ to: ada.email, mail: VerifyEmailMail });
    const token = mail.link('/verify-email').searchParams.get('token');
    await request(app.getHttpServer()).post('/auth/email/verify').send({ token }).expect(200);

    await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', cookie)
      .expect(200, { id: res.body.id, email: ada.email, emailVerified: true, roles: ['customer'] });
  });

  it('issues bearer tokens to the mobile app', async () => {
    const res = await request(app.getHttpServer()).post('/auth/token').send(ada).expect(200);

    await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(200, []);
  });

  it('resets a forgotten password', async () => {
    await request(app.getHttpServer()).post('/auth/password/forgot').send({ email: ada.email }).expect(202);
    // The email goes out after the response, which doesn't wait for it.
    const mail = await vi.waitFor(() => mailbox.assertSent({ to: ada.email, mail: PasswordResetMail }));
    const token = mail.link('/reset-password').searchParams.get('token');

    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token, password: 'a brand new passphrase' })
      .expect(200);
    await request(app.getHttpServer()).post('/auth/sign-in').send(ada).expect(401);
  });

  it('rejects anonymous requests and wrong passwords', async () => {
    await request(app.getHttpServer()).get('/orders').expect(401);
    await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ ...ada, password: 'not the password' })
      .expect(401);
  });
});
```

- `mailbox.assertSent()` finds the latest email to an address, of a mail class, and `link()` returns its first link containing the path, as a `URL`. That's the whole flow for verification, reset and magic links: send, find the link, follow it.
- The reset email is sent after the response (see [Reset forgotten passwords](/security/authentication#reset-forgotten-passwords)), so the test waits for it with `vi.waitFor()`. The other emails are sent before the route answers.
- `DrizzleAuthenticationStore` runs on PGlite as it does on PostgreSQL. PGlite has a single connection, so two requests never truly race there; the store's [contract tests](/security/authentication#keep-sessions-and-tokens-in-your-database) run on PostgreSQL too, where they do.

To sign a test user in without going through a sign-in route, `SessionService.create()` returns a session cookie, and `TokenService.issue()` a bearer token (for a user without an authenticator). To test code that reads `AuthenticationContext` without HTTP, run it as a user: `run()` takes an authentication result (the user, and optionally the session) and a function to run.

#### Production checklist

- **Register a store for everything the module keeps**, as in [Keep sessions and tokens in your database](/security/authentication#keep-sessions-and-tokens-in-your-database), and apply its tables through your migrations. Every instance of the application uses them, so a restart signs nobody out. The module refuses to start while a store that a configured feature uses isn't registered, but only when `NODE_ENV` is `production`: set it, or a deployment that forgets it runs in memory with nothing but a startup log line to say so. Run the package's contract tests against your store with `concurrent: true` on PostgreSQL: they fail a store that reads and then writes where one conditional statement is needed.
- **Send email through a real provider.** Set `SMTP_URL`, or pass another transport. `LogMailTransport` writes every link to the log, where anyone who reads the logs could sign in as the customer.
- **Serve the application over HTTPS**, since the session cookie is `Secure`. If the web app runs on another origin than the API, list it in `session.trustedOrigins`, or its sign-ins and magic-link requests are refused, and its `POST` requests and WebSocket connections are anonymous. Behind a proxy that rewrites `Host`, list the public origin there too. Leave `cookie.secure` on: a `SameSite=None` cookie without it fails at startup, since browsers would drop it.
- **Call `app.enableCsrfProtection()` on Nest 12.1 or later**, with the same `trustedOrigins`. It refuses cross-origin writes to every route, not only those that use the session cookie.
- **Keep secrets in a secret manager**: the JWT secret, the TOTP encryption keys, the Google client secret and the SMTP credentials. Rotate the TOTP keys as described in [Add two-factor authentication](/security/authentication#add-two-factor-authentication).
- **Build the verification and reset pages to POST the token**, and serve them from `APP_URL`. Email scanners follow the links with GET requests; a page that used the token on load would let them spend it.
- **Keep `forgot` from revealing anything.** Answer it the same way whatever happens, as the [`forgot` route](/security/authentication#reset-forgotten-passwords) does, and don't `await` `request()`. Sign-up still answers 409 for an address that has an account; if that matters to you, answer sign-up the same way too, and email the owner instead.
- **Register the production redirect URI** with Google, and set `APP_URL` to the public origin of the application.
- **Size the servers for scrypt.** Each hash at the default cost takes 128 MiB, on the libuv threadpool (four threads unless you set `UV_THREADPOOL_SIZE`). Sign-in bursts queue behind each other; the throttler bounds them.
- **Use shared storage for the throttler**, such as Redis. Its default storage counts in each process's memory, so every instance counts on its own and a restart or deploy resets the counts. Enable `trust proxy` behind a proxy. For guessing spread across many IP addresses, add a second throttler whose tracker is the email alone; it also keeps a customer's inbox from filling up with reset links.
- **Rotate sessions on privilege changes** with `SignInService.rotateSession()`. After a password change made while signed in, or when a customer turns on two-factor authentication, also end their other sessions and refresh tokens: `SessionService.revokeAll()` with the current session as `except`, and `TokenService.revokeAll()`. Whoever knew the old password may still be signed in. A [password reset](/security/authentication#reset-forgotten-passwords) does this for you.
- **Handle API keys as secrets.** The table keeps only their hashes, and a key is shown once, when it's created: a leaked database gives nobody a key, and a lost key is revoked and replaced, never shown again. Keys expire after a year, so remind their owners to create the next one while the old one still works. Add the `cat_` pattern to your secret scanner (GitHub secret scanning takes custom patterns) to find keys committed to repositories, and revoke them. Requests made with a key emit no events: log the `keyId` from `@CurrentSession()` where you need to know which key did what. A password reset or a sign-out everywhere leaves keys alone: revoke them on those events if they should cut keys off too.
- **Keep an audit trail.** `AuthenticationEvents` publishes every sign-in and sign-out, second-factor change, reused refresh token, password reset and email verification, on its `events$` stream and on `node:diagnostics_channel`. Store them where your security team can search them. Alert on repeated `mfa-failed` events with `locked: true` (someone who has the password is guessing codes), and on many `password-reset-requested` events without a `userId` from one source (someone is probing for accounts).
- **Import `AuthenticationModule` before `AuthorizationModule`** if you add `@nestjs/authorization`. Global guards run in import order, and authorization needs the user that authentication sets. The other order fails at startup.

#### The store contract

The tutorial [wrote the authentication store with Drizzle](/security/authentication#keep-sessions-and-tokens-in-your-database). This section sums up what the six contracts ask of any store, for writing one with another ORM. Each method of the store interfaces gives its rule in its doc comment, with the race the rule prevents, and the package's contract tests check them.

**Registration.** A store is an ordinary singleton provider that registers itself in its constructor with `registerSource()` on the injectable `AuthenticationStorage`, by contract name: `sessions`, `refreshTokens`, `mfa`, `magicLinks`, `oidcStates` and `emailTokens`. Method names never repeat across the contracts, so one class can implement all six, or several classes can split them. The registry checks each store's shape at once, refuses a second store for a name unless it passes `replace: true`, and locks when `AuthenticationModule` initializes, logging where each kind of state lives. A contract with no store uses its in-memory default, which loses everything on restart and isn't shared between instances.

**Production guard.** With `NODE_ENV=production`, startup fails while a contract that a configured feature uses has no store, naming each missing interface. A feature uses more than its own contract: every sign-in reads `mfa` for an authenticator, with or without the `mfa` option, and every revocation, signing out everywhere or resetting a password, reaches both `sessions` and `refreshTokens`. A contract that none of your configured features uses fails at its first read instead of running in memory. `allowInMemoryStorage: true` in the module options accepts the in-memory stores anyway, but then every restart or deploy signs everyone out and forgets enrolled authenticators, and instances don't share any of it.

**The methods that must be atomic.** Whatever decides that something works only once is one conditional statement, never a read followed by a write. The other methods are plain reads, inserts and deletes. None takes your transaction: authentication state is written on its own, never as part of a business transaction.

| Contract | Method | Must be | Why |
| --- | --- | --- | --- |
| `SessionStore` | `touchSession()` | a conditional `UPDATE` of an existing row, moving `lastActiveAt` forward only | a request writing the session back after a sign-out would bring it back |
| `SessionStore` | `deleteSession()` | a `DELETE` that resolves whether it deleted the row, from its row count | of two rotations of one session, or a rotation and a sign-out, only one may win |
| `RefreshTokenStore` | `markRefreshTokenUsed()` | an `UPDATE ... WHERE used_at IS NULL`, counting rows | a thief and the owner refreshing at once must not both win |
| `MfaStore` | `saveTotp()` | an upsert that keeps the larger `lastUsedStep` | saving the record must not reopen a step just claimed |
| `MfaStore` | `claimTotpStep()`, `consumeRecoveryCode()` | a conditional `UPDATE`, a `DELETE`, counting rows | a replayed code must fail |
| `MfaStore` | `recordMfaFailure()` | an insert, then a count, each committed on its own | a burst of parallel guesses must not all see a low count |
| `MfaStore` | `saveRecoveryCodes()` | one transaction: delete, then insert | a reader must never see half a batch |
| `MagicLinkStore`, `OidcStateStore`, `EmailTokenStore` | `consumeMagicLink()`, `consumeOidcState()`, `consumeEmailToken()` | a `DELETE ... RETURNING` | one link must not sign in two browsers, or set two passwords |

A family of refresh tokens counts as revoked when any of its tokens is, so a successor saved after the revocation is revoked too. And the pending entries (magic links, OIDC logins, email tokens) stay bounded: each save deletes what has expired and, past a cap, what expires first.

**With Prisma.** The tutorial has the store with Drizzle and with TypeORM, on the same tables. A Prisma store follows the same rules:

- **Conditional updates and deletes** (`touchSession()`, `deleteSession()`, `markRefreshTokenUsed()`, `claimTotpStep()`, `consumeRecoveryCode()`) are `updateMany()` or `deleteMany()` with the condition in `where`, and their `count`: `deleteSession()` resolves `count > 0`. Never `upsert()` for `touchSession()`: it can write back a session that was just deleted.
- **`saveTotp()`** needs `GREATEST(..., excluded.last_used_step)` in its upsert. Prisma's upsert API doesn't take an expression from the conflicting row, so it is raw SQL, with `$executeRaw`.
- **The `consume` methods** are `delete()` with every condition in `where` (the id and, for `consumeEmailToken()`, the purpose), which throws `P2025` when nothing matched: turn that into `undefined`.
- **`recordMfaFailure()`** is two statements on their own: a `create()`, then a `count()`. Not `prisma.$transaction([create, count])`, which runs the two in one transaction that commits after the count.
- **`saveRecoveryCodes()`** is the one method that needs a transaction: `$transaction()`, whose array form fits here.

**Test it** with the suite from `@nestjs/authentication/testing`, as the tutorial does. `authenticationStoreContract()` returns cases for any test runner, for the contracts your factory returns. `concurrent: true` adds the races: parallel refreshes of one token, parallel uses of one code or link, bursts of failed codes, a sign-out racing a request, parallel deletes of one session, and a rotation racing a sign-out or another rotation. Run it against PostgreSQL with a connection pool, where a store that reads and then writes fails them. `maxPending` checks the cap on pending entries, with a small cap configured for the test.

#### Reference

##### Module options

`AuthenticationModule.forRoot()` takes these options, and the `forRootAsync()` factory returns them, except `isGlobal` and `globalGuard`, which stay at the top level. Lifetimes are milliseconds, or strings such as `'30s'`, `'15m'` and `'14d'`, up to 100 years; a longer one fails at startup. Every group that has a clock also takes `now`, a function returning epoch milliseconds, for tests.

| Option | Default | Description |
| --- | --- | --- |
| `isGlobal` | `true` | Register the module globally. |
| `globalGuard` | `true` | Register `AuthenticationGuard` as a global guard. With `false`, routes stay open until they use `@UseGuards(AuthenticationGuard)`. |
| `allowInMemoryStorage` | `false` | Start with `NODE_ENV=production` while a contract a feature uses has no store. See [Keep sessions and tokens in your database](/security/authentication#keep-sessions-and-tokens-in-your-database). |
| `session.cookieName` | `__Host-sid` | The session cookie; `sid` when `cookie` rules out the `__Host-` prefix. |
| `session.absoluteTtl` | `'7d'` | A session's maximum lifetime, however active it is. |
| `session.idleTtl` | `'1d'` | Idle timeout, extended by activity. `0` turns it off. |
| `session.touchInterval` | `'1m'` | How often activity is written to the store at most. Shorter than `idleTtl`, unless that is `0`: a longer one fails at startup, since active users would be signed out as idle. |
| `session.cookie` | `secure: true`, `sameSite: 'lax'`, `path: '/'` | Cookie attributes: `secure`, `sameSite`, `path`, `domain`. `HttpOnly` is always set. |
| `session.trustedOrigins` | none | Other origins whose pages may use the session cookie for writes and sign in. |
| `session.metadata` | none | A function of the sign-in request whose result is stored with each new session. See [Let customers manage their sessions](/security/authentication#let-customers-manage-their-sessions). |
| `password.logN` | `17` | Base-2 logarithm of the scrypt cost N, an integer from 10 to 22. `r` (default `8`, up to 32), `p` (`1`, up to 16), `keyLength` (`32`) and `saltLength` (`16`, both from 16 to 64) set the other parameters. A hash may take at most 1 GiB of memory (128·N·r bytes) and 16 times the default work (N·r·p), so with `r` at 8, `logN` stops at 20. |
| `accessToken.key` | required | HS256 secret of at least 32 bytes, or a private key for RS256, ES256 or EdDSA, as PEM text or a `KeyObject`. A JWK or a DER key fails at startup: import it with `createPrivateKey()`. See [Issue tokens to the mobile app](/security/authentication#issue-tokens-to-the-mobile-app). |
| `accessToken.alg` | from the key | Signing algorithm: HS256 for a secret, the key's own for a private key. |
| `accessToken.issuer`, `audience` | none | The `iss` and `aud` claims, written into and checked on every token. |
| `accessToken.ttl` | `'15m'` | Access token lifetime. |
| `accessToken.kid`, `type` | none, `JWT` | The `kid` and `typ` headers. |
| `refreshToken.ttl` | `'30d'` | Lifetime of one refresh token. |
| `refreshToken.absoluteTtl` | `'90d'` | Maximum lifetime of a refresh-token family, however often it rotates. |
| `mfa.encryption` | required | `keys`, a list of AES-256-GCM keys, newest first, plus `migratePlaintext` (default `false`); or `false` to store secrets in plaintext. See [Add two-factor authentication](/security/authentication#add-two-factor-authentication). |
| `mfa.issuer` | none | The name authenticator apps show. |
| `mfa.window` | `1` | Accepted 30-second steps on either side of now, an integer from 0 to 10. |
| `mfa.maxAttempts` | `5` | Failed codes allowed per `lockoutWindow` before every code is refused, an integer of at least 1. |
| `mfa.lockoutWindow` | `'15m'` | The window failed codes are counted in. |
| `mfa.recoveryCodes` | `10` | Recovery codes per batch, an integer of at least 1. |
| `mfa.pendingTtl` | `'10m'` | How long a session may wait for its second factor. |
| `emailVerification.url` | required | The page verification links open. `ttl` defaults to `'24h'`. See [Verify email addresses](/security/authentication#verify-email-addresses). |
| `passwordReset.url` | required | The page reset links open. `ttl` defaults to `'1h'`. See [Reset forgotten passwords](/security/authentication#reset-forgotten-passwords). |
| `magicLink.url` | required | The page magic links open. `ttl` defaults to `'15m'`. See [Add magic-link sign-in](/security/authentication#add-magic-link-sign-in). |
| `magicLink.bindToBrowser` | `true` | Accept a link only in the browser that requested it. |
| `magicLink.cookie` | `secure: true` | Attributes of the `__Host-magic_link_tx` transaction cookie. |
| `oidc.callbackUrl` | required | The public callback URL, with `:provider` in place of the provider's name. See [Add "Sign in with Google"](/security/authentication#add-sign-in-with-google). |
| `oidc.providers` | required | Provider configurations by name, such as `google()`, `github()` and `microsoft()`, which also takes the directory's `tenant` id. |
| `oidc.redirectAfterLogin` | `/` | Where to land when the login had no `redirectTo`. |
| `oidc.transactionTtl` | `'10m'` | How long a login may take between the redirect and the callback. |
| `oidc.cookie` | `secure: true` | Attributes of the `__Host-oidc_tx` transaction cookie. |
| `oidc.discoveryTtl`, `clockTolerance` | `'1h'`, `'30s'` | How long a discovery document is trusted, and the leeway for ID token time claims. |

The `emailVerification`, `passwordReset`, `magicLink` and `oidc` features also need a registered handler of the same name; one without the other fails at startup. So does a value outside the ranges above, including the `NaN` that `Number()` makes of an environment variable that isn't set.

##### Route options

`@Authenticate()` takes these options, on a class or a method:

| Option | Description |
| --- | --- |
| `optional` | Let anonymous callers through, with `null` as the user. Bad credentials still get a 401. |
| `mfa` | Require a verified second factor: a verified session, or a JWT whose `amr` contains `mfa`, `otp` or `hwk`. API keys never satisfy it. See [Add two-factor authentication](/security/authentication#add-two-factor-authentication). |
| `verifiedEmail` | Require a verified email address, or answer 403 with `email_unverified`. See [Read the current user](/security/authentication#read-the-current-user). |
| `providers` | Only these provider classes, or their subclasses, may authenticate the route. |

##### API keys

`ApiKeyProvider` takes these options in `super()`. See [Issue API keys to partners](/security/authentication#issue-api-keys-to-partners).

| Option | Default | Description |
| --- | --- | --- |
| `prefix` | required | Starts every key, as in `cat_<id>_<secret>`: 1 to 16 lowercase letters and digits, starting with a letter. |
| `realm` | `api` | The realm in the `WWW-Authenticate` challenge. |

Your subclass implements `findKey(id)`, which returns the key's stored `hash`, its `user` and its `expiresAt`, or `null` for a key that doesn't exist, was revoked, or whose owner is gone. `generate()` returns a new key as `key`, shown once, with the `id` and `hash` to store. For a request made with a key, the session is the key's `keyId` and `expiresAt`, with `method` set to `api-key`.

##### Events

`AuthenticationEvents` publishes each event on its `events$` observable, and on the `nestjs:authentication:<type>` diagnostics channel, such as `nestjs:authentication:sign-in`.

| Type | Payload | When |
| --- | --- | --- |
| `sign-in` | `userId`, `sessionId` or `tokenFamilyId`, `method`, `mfa`, `metadata` | `SignInService.signIn()` or `TokenService.issue()` signed a user in |
| `sign-out` | `userId`, `sessionId`, `tokenFamilyId` or `everywhere` | A session, a refresh-token family, or all of them ended |
| `mfa-verified` | `userId`, `method` (`totp` or `recovery-code`) | A code was accepted |
| `mfa-failed` | `userId`, `method`, `failures`, `locked` | A code was refused, including during a lockout |
| `mfa-enabled` | `userId`, `replaced` | An authenticator was confirmed |
| `mfa-disabled` | `userId` | The authenticator and recovery codes were removed |
| `recovery-codes-generated` | `userId`, `count` | A new batch of recovery codes replaced the old one |
| `refresh-token-reused` | `userId`, `tokenFamilyId` | A spent refresh token came back, and its family was revoked |
| `password-reset-requested` | `email`, `userId` (absent for an unknown address) | Someone asked for a reset link |
| `password-reset` | `userId` | A reset link set a new password |
| `email-verified` | `userId`, `email` | A verification link was used |
| `magic-link-refused` | `reason` (`not-this-browser`, `unknown`, `expired` or `refused`), `email` | A magic link signed nobody in |

##### Errors

`AuthenticationError` is the base class of the package's errors. It carries `status`, and optionally `code` (the body's `error` field) and `challenge` (the `WWW-Authenticate` header). Thrown from a handler or anything it calls, it becomes Nest's own HTTP exception, GraphQL `UNAUTHENTICATED`, a `WsException` or an `RpcException`.

| Error | Status | `error` in the body | When |
| --- | --- | --- | --- |
| `AuthenticationError` | 401 | none | Missing or bad credentials, or `requireUser()` without a user |
| `JwtError` | 401 | none | A token is malformed, badly signed, expired, or for another issuer or audience |
| `RefreshTokenError` | 401 | none | A refresh token is invalid, expired or reused; `reason` says which |
| `MagicLinkError` | 401 | `not_this_browser` | A magic link was opened in another browser than the one that requested it |
| `MfaAlreadyEnrolledError` | 409 | `Conflict` | `enroll()` without `replace: true` for a user with a confirmed authenticator |

The guard and `TokenService.issue()` also answer 401 with `mfa_required` while a second factor is missing, and 403 with `email_unverified` on `verifiedEmail` routes. The OIDC routes answer 400 for a bad or forged callback, 401 when the provider's answer fails verification or a link flow has no signed-in session, 403 when the resolver refuses the account or a link flow is started from another site, 404 for a provider name that isn't configured, and 502 when the provider can't be reached or is misconfigured, such as an endpoint that isn't https or a key set that can't be loaded. `SignInService.signIn()` and `MagicLinkService.create()` answer 403 to a request posted from another origin.
