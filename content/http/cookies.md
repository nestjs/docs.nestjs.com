### Cookies

An **HTTP cookie** is a small piece of data that the user's browser stores. Cookies were designed as a reliable mechanism for websites to remember stateful information. When the user visits the website again, the browser automatically sends the cookie with the request.

Starting with NestJS v12.1, Nest supports cookies out of the box. The same API works on every HTTP adapter (Express, Fastify, or your own adapter extending `AbstractHttpAdapter`), and no extra package is needed:

- the `@Cookies()` and `@SignedCookies()` parameter decorators read the cookies sent with the request
- the HTTP adapter's `setCookie()` and `clearCookie()` methods write `Set-Cookie` response headers
- the `cookies` application option enables signed cookies, with support for rotating secrets

Applications that already use `cookie-parser` or `@fastify/cookie` keep working unchanged. See [Using cookie-parser or @fastify/cookie](#using-cookie-parser-or-fastifycookie) to learn how the two approaches interact.

#### Reading cookies

Use the `@Cookies()` decorator to extract cookies from the incoming request. Pass a cookie name to extract a single cookie, or omit it to get all cookies as an object keyed by cookie name.

```typescript
import { Controller, Cookies, Get } from '@nestjs/common';

@Controller('preferences')
export class PreferencesController {
  @Get()
  findAll(@Cookies() cookies: Record<string, string>) {
    return cookies;
  }

  @Get('theme')
  findTheme(@Cookies('theme') theme?: string) {
    return theme ?? 'light';
  }
}
```

> info **Hint** Import the `@Cookies()` decorator from the `@nestjs/common` package.

A named cookie that was not sent resolves to `undefined`. Nest parses the `Cookie` header only when a parameter asks for cookies, and at most once per request. Values are percent-decoded, and when the same name appears more than once, the first occurrence wins (browsers send the cookie with the most specific path first).

As with `@Query()` or `@Param()`, you can pass [pipes](/pipes) after the cookie name:

```typescript
@Get('cart')
findCart(@Cookies('cartSize', ParseIntPipe) cartSize: number) {
  return { cartSize };
}
```

With this in place, a `cartSize=abc` cookie results in a `400 Bad Request` response, and so does a missing cookie, unless you enable the pipe's `optional` option.

> info **Hint** Pipes receive cookie parameters with the `type` property of `ArgumentMetadata` set to `'custom'`. As a result, a global `ValidationPipe` skips them unless you enable its `validateCustomDecorators` option.

> warning **Warning** `@Cookies()` does not verify signatures. Its values come straight from the client and may have been tampered with, so read any value you need to trust with `@SignedCookies()` instead (see [Signing cookies](#signing-cookies)).

#### Setting and clearing cookies

Cookies are written through the HTTP adapter, which exposes two methods for this purpose:

- `setCookie(response, name, value, options?)` appends a `Set-Cookie` header to the response
- `clearCookie(response, name, options?)` appends a `Set-Cookie` header that expires the cookie immediately

Both methods take the native response object as their first argument. In a route handler, inject the `HttpAdapterHost` (see [HTTP adapter](/faq/http-adapter)) and get hold of the response object with the `@Res()` decorator, with its `passthrough` option enabled:

```typescript
import { Body, Controller, Delete, Put, Res } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  @Put('theme')
  setTheme(
    @Body('theme') theme: string,
    @Res({ passthrough: true }) res: unknown,
  ) {
    this.adapterHost.httpAdapter.setCookie(res, 'theme', theme, {
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // one year, in seconds
    });
  }

  @Delete('theme')
  resetTheme(@Res({ passthrough: true }) res: unknown) {
    this.adapterHost.httpAdapter.clearCookie(res, 'theme');
  }
}
```

> warning **Warning** To leave the response handling logic to the framework, set the `passthrough` option to `true`, as shown above. See the [library-specific approach](/controllers#library-specific-approach) section of the Controllers chapter for details.

The controller never needs to know the type of the response object: `setCookie()` accepts whatever the underlying platform provides (an Express `Response`, a `FastifyReply`, and so on), which keeps the code platform-agnostic. Each call appends its own `Set-Cookie` header, so all the cookies set while handling a request are sent, on every platform. Because these methods only need the response object, you can also call them from a guard or an interceptor, using `context.switchToHttp().getResponse()`.

> info **Hint** `setCookie()` and `clearCookie()` are optional members of the `HttpServer` interface. `AbstractHttpAdapter` implements them once, on top of its `appendHeader()` method, so every adapter that extends it (including `ExpressAdapter` and `FastifyAdapter`) supports them.

The cookie value must be a string. It is always percent-encoded with `encodeURIComponent()` (and decoded again by `@Cookies()`), so any string is safe to store. Convert other types yourself, for example with `JSON.stringify()`.

The `options` argument (the `CookieSerializeOptions` interface, exported from `@nestjs/common`) accepts the following attributes:

| Option        | Description                                                                                                                             | Default   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `path`        | `Path` attribute.                                                                                                                       | `'/'`     |
| `domain`      | `Domain` attribute. Must be a valid host name, optionally with a leading dot. When omitted, the cookie is host-only.                   | not set   |
| `maxAge`      | `Max-Age` attribute, in **seconds**. Must be an integer.                                                                                | not set   |
| `expires`     | `Expires` attribute, as a `Date`. Browsers give precedence to `maxAge` when both are set.                                              | not set   |
| `httpOnly`    | `HttpOnly` attribute. Hides the cookie from client-side JavaScript.                                                                     | `false`   |
| `secure`      | `Secure` attribute. The browser only sends the cookie over HTTPS.                                                                       | `false`   |
| `sameSite`    | `SameSite` attribute: `'strict'`, `'lax'` or `'none'`. `'none'` requires `secure: true`.                                                | not set   |
| `partitioned` | `Partitioned` attribute (CHIPS). Requires `secure: true`.                                                                               | `false`   |
| `priority`    | `Priority` attribute (non-standard, honored by Chromium): `'low'`, `'medium'` or `'high'`.                                              | not set   |
| `signed`      | Signs the value with the first configured secret. See [Signing cookies](#signing-cookies).                                             | `false`   |

Apart from `path`, no attribute has a default value, `httpOnly` included, which matches the behavior of Express and `@fastify/cookie`. For cookies that carry credentials or session identifiers, set `httpOnly`, `secure` and `sameSite` explicitly.

> warning **Warning** `maxAge` is expressed in **seconds**, as in RFC 6265 and `@fastify/cookie`. Express' `res.cookie()` method takes `maxAge` in **milliseconds**, so a value carried over from it unchanged makes the cookie live 1000 times longer. For one day, pass `60 * 60 * 24`.

`clearCookie()` writes an empty cookie with `Max-Age=0` and an `Expires` date in the past. Browsers only remove a cookie when the `path` and `domain` match the ones it was set with, so pass the same values to both methods. Since `path` defaults to `/` in both of them, `clearCookie(res, 'theme')` clears a cookie set with `setCookie(res, 'theme', value)`. The `maxAge`, `expires` and `signed` options are ignored by `clearCookie()`.

#### Signing cookies

A signed cookie carries an HMAC signature next to its value, which lets the server detect whether the client tampered with it. To enable signing, pass a secret through the `cookies` option of the `NestFactory.create()` method:

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  cookies: {
    secret: process.env.COOKIE_SECRET,
  },
});
```

Then, set cookies with the `signed` option and read them back with the `@SignedCookies()` decorator:

```typescript
import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  SignedCookies,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: unknown,
  ) {
    const user = await this.authService.signIn(signInDto);
    this.adapterHost.httpAdapter.setCookie(res, 'uid', String(user.id), {
      signed: true,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60, // one hour, in seconds
    });
  }

  @Get('profile')
  getProfile(@SignedCookies('uid') userId?: string) {
    if (!userId) {
      throw new UnauthorizedException();
    }
    return this.authService.findProfile(userId);
  }

  @Post('logout')
  signOut(@Res({ passthrough: true }) res: unknown) {
    this.adapterHost.httpAdapter.clearCookie(res, 'uid');
  }
}
```

> info **Hint** Import the `@SignedCookies()` decorator from the `@nestjs/common` package.

`@SignedCookies('uid')` resolves to the original, unsigned value when the signature verifies. When the cookie is missing, is not signed, was tampered with, or was signed with a secret that is not configured, it resolves to `undefined`. Called without a name, `@SignedCookies()` returns an object that contains only the cookies whose signature verifies. Like `@Cookies()`, it accepts pipes after the cookie name.

Signing fails loudly when no secret is configured: `setCookie()` with the `signed` option throws an error, and so does resolving a `@SignedCookies()` parameter (unless `cookie-parser` provides signed cookies, see [below](#using-cookie-parser-or-fastifycookie)), which results in a `500 Internal Server Error` response instead of every signed cookie silently reading as `undefined`. An empty secret (an empty string, an empty array, or an array with an empty entry) throws when the application is created.

> warning **Warning** A `secret` that is `undefined`, for example because an environment variable is not set, counts as no secret at all. The application starts, and the error only surfaces when a request sets or reads a signed cookie. Validate your configuration at startup, for example as described in the [Configuration](/application/configuration#schema-validation) chapter.

> warning **Warning** Signing protects the integrity of a cookie, not its confidentiality: the value is stored in plain text, and the client can read it. Do not store sensitive data in a signed cookie. Also note that, as with the `cookie-signature` package, the cookie name is not part of the signed data, so a value signed for one cookie also verifies when the client sends it under another name.

##### Rotating secrets

To replace a secret without invalidating the cookies signed with it, pass an array of secrets. Nest signs new cookies with the first secret and verifies incoming cookies against all of them:

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  cookies: {
    // Signs with the first secret, verifies with all of them.
    secret: ['current-secret', 'previous-secret'],
  },
});
```

To rotate, add the new secret at the beginning of the array, and remove the previous one once every cookie signed with it has expired. Signatures are compared in constant time, and against every secret, so the response time does not reveal which secret matched.

##### Signature format

Nest signs cookies in the format of the `cookie-signature` package, which `cookie-parser` and `express-session` use as well: the `s:` prefix, followed by the value, a dot, and the HMAC-SHA256 digest of the value in base64, without padding. As a result:

- cookies signed with the same secret by Express (the `signed` option of `res.cookie()`), `cookie-parser` or `express-session` keep verifying after you move to the built-in API, and `cookie-parser` can verify cookies signed by Nest
- values signed by `@fastify/cookie`, which omits the `s:` prefix, verify as well. The opposite direction does not work: the `unsignCookie()` method of `@fastify/cookie` cannot verify cookies signed by Nest, because of the `s:` prefix

#### Invalid names and attributes

`setCookie()` and `clearCookie()` reject invalid input instead of escaping it, so neither a cookie name nor an attribute can inject additional attributes or headers through `;`, CR or LF characters. They throw a `TypeError` when:

- the name is not a valid RFC 7230 token (for example, it contains spaces, `;`, `=` or control characters)
- `path` contains a `;`, or a character outside printable ASCII
- `domain` is not a valid host name (a leading dot is allowed)
- `maxAge` is not an integer, or `expires` is not a valid `Date`
- `sameSite` or `priority` is not one of the allowed values
- `sameSite` is `'none'`, or `partitioned` is `true`, while `secure` is not `true`. Browsers silently drop such cookies, so Nest reports the mistake instead
- the value is not a string

The content of the value is never rejected: since it is percent-encoded, a `;`, CR or LF in a value becomes `%3B`, `%0D` or `%0A`.

These errors are not HTTP exceptions, so when one is thrown from a route handler, the client receives a `500 Internal Server Error` response. If a cookie name or an attribute comes from user input, validate it before calling `setCookie()`.

> info **Hint** Nest does not enforce the rules of the `__Host-` and `__Secure-` cookie name prefixes. If you use them, set the attributes they require yourself: `secure: true` for both, plus `path: '/'` and no `domain` for `__Host-`.

#### Using cookie-parser or @fastify/cookie

Before the built-in support was available, reading cookies required the `cookie-parser` middleware (Express) or the `@fastify/cookie` plugin (Fastify). Applications that use them keep working, and the built-in decorators cooperate with them:

- `@Cookies()` returns `req.cookies` as is whenever a middleware or plugin has populated it, and only parses the `Cookie` header itself otherwise. The behavior of that package therefore carries over. For example, `cookie-parser` moves signed cookies from `req.cookies` to `req.signedCookies` when it is given a secret, and turns `j:`-prefixed JSON cookies into objects.
- When the `cookies.secret` application option is set, `@SignedCookies()` always verifies the raw `Cookie` header against the Nest secrets, and ignores `req.signedCookies`. Configure the same secret (or secrets) as your middleware, so that the cookies it signed keep verifying.
- Without the `cookies.secret` option, `@SignedCookies()` falls back to the `req.signedCookies` object populated by `cookie-parser` (when it is given a secret), and treats the cookies it marked as invalid as missing. `@fastify/cookie` does not populate `req.signedCookies`, so on Fastify, `@SignedCookies()` requires the `cookies.secret` option.

Nest never assigns `req.cookies` itself. If you remove `cookie-parser` or `@fastify/cookie`, replace any code that reads `request.cookies` (or calls `reply.setCookie()`) with the built-in decorators and adapter methods. Likewise, if your application defines its own `@Cookies()` decorator with `createParamDecorator()`, you can replace it with the built-in one. When you replace `res.cookie()` calls with `setCookie()`, remember to convert `maxAge` from milliseconds to seconds.

##### Express (cookie-parser)

First, install the [cookie-parser](https://github.com/expressjs/cookie-parser) package (and its types, for TypeScript users):

```shell
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
```

Once the installation is complete, apply the `cookie-parser` middleware globally (for example, in your `main.ts` file):

```typescript
import cookieParser from 'cookie-parser';
// somewhere in your initialization file
app.use(cookieParser('my-secret'));
```

The first argument is an optional secret (or an array of secrets) used to verify signed cookies. The middleware parses the `Cookie` header and exposes the cookies as `req.cookies` and, if a secret was provided, the verified signed cookies as `req.signedCookies` (a signed cookie that fails verification has the value `false`). See the [cookie-parser repository](https://github.com/expressjs/cookie-parser) for the other options.

With this in place, you can read cookies with the `@Cookies()` and `@SignedCookies()` decorators, or from the request object:

```typescript
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
  // or console.log(request.signedCookies);
}
```

To attach a cookie to an outgoing response, use the adapter's `setCookie()` method or the `Response#cookie()` method:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value');
}
```

> info **Hint** Import the `@Req()` and `@Res()` decorators from the `@nestjs/common` package, and `Request` and `Response` from the `express` package.

##### Fastify (@fastify/cookie)

First, install the required package:

```shell
$ npm i @fastify/cookie
```

Once the installation is complete, register the `@fastify/cookie` plugin:

```typescript
import fastifyCookie from '@fastify/cookie';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(fastifyCookie, {
  secret: 'my-secret', // for cookies signature
});
```

With this in place, you can read cookies with the `@Cookies()` decorator, or from the request object:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
}
```

To attach a cookie to an outgoing response, use the adapter's `setCookie()` method or the `FastifyReply#setCookie()` method (see the [@fastify/cookie documentation on sending cookies](https://github.com/fastify/fastify-cookie#sending)):

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value');
}
```

> info **Hint** Import the `@Req()` and `@Res()` decorators from the `@nestjs/common` package, and `FastifyRequest` and `FastifyReply` from the `fastify` package.
