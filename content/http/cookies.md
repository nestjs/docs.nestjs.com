### Cookies

An **HTTP cookie** is a small piece of data that the user's browser stores. Cookies were designed as a reliable mechanism for websites to remember stateful information. When the user visits the website again, the browser automatically sends the cookie with the request.

#### Use with Express (default)

First, install the [cookie-parser](https://github.com/expressjs/cookie-parser) package (and its types, for TypeScript users):

```shell
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
```

Once the installation is complete, apply the `cookie-parser` middleware globally (for example, in your `main.ts` file):

```typescript
import cookieParser from 'cookie-parser';
// somewhere in your initialization file
app.use(cookieParser());
```

The `cookieParser()` function accepts two optional arguments:

- `secret`: a string or an array used for signing cookies. If you omit it, signed cookies aren't parsed. If you pass a string, it's used as the secret. If you pass an array, the middleware tries to unsign the cookie with each secret in order.
- `options`: an object passed to `cookie.parse` as the second argument. See the [cookie](https://www.npmjs.org/package/cookie) package for more information.

The middleware parses the `Cookie` header of the request and exposes the cookie data as the `req.cookies` property and, if you provided a secret, as the `req.signedCookies` property. Both properties are objects that map cookie names to cookie values.

When you provide a secret, the middleware unsigns and validates any signed cookie values and moves those name-value pairs from `req.cookies` into `req.signedCookies`. A signed cookie is a cookie whose value is prefixed with `s:`. Signed cookies that fail signature validation have the value `false` instead of the tampered value.

With this in place, you can read cookies in your route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
  // or console.log(request.signedCookies);
}
```

> info **Hint** Import the `@Req()` decorator from the `@nestjs/common` package and `Request` from the `express` package.

To attach a cookie to an outgoing response, use the `Response#cookie()` method:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value');
}
```

> warning **Warning** To leave the response handling logic to the framework, set the `passthrough` option to `true`, as shown above. See the [library-specific approach](/controllers#library-specific-approach) section of the Controllers chapter for details.

> info **Hint** Import the `@Res()` decorator from the `@nestjs/common` package and `Response` from the `express` package.

#### Use with Fastify

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

With this in place, you can read cookies in your route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // or "request.cookies['cookieKey']"
}
```

> info **Hint** Import the `@Req()` decorator from the `@nestjs/common` package and `FastifyRequest` from the `fastify` package.

To attach a cookie to an outgoing response, use the `FastifyReply#setCookie()` method:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value');
}
```

To learn more about the `FastifyReply#setCookie()` method, see the [@fastify/cookie documentation on sending cookies](https://github.com/fastify/fastify-cookie#sending).

> warning **Warning** To leave the response handling logic to the framework, set the `passthrough` option to `true`, as shown above. See the [library-specific approach](/controllers#library-specific-approach) section of the Controllers chapter for details.

> info **Hint** Import the `@Res()` decorator from the `@nestjs/common` package and `FastifyReply` from the `fastify` package.

#### Creating a custom decorator (cross-platform)

To access incoming cookies in a convenient, declarative way, you can create a [custom decorator](/custom-decorators).

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});
```

The `@Cookies()` decorator extracts either all cookies or a single named cookie from the `req.cookies` object and populates the decorated parameter with that value. Because both `cookie-parser` and `@fastify/cookie` populate `request.cookies`, the decorator works with either HTTP adapter.

With this in place, you can use the decorator in a route handler signature, as follows:

```typescript
@Get()
findAll(@Cookies('name') name: string) {}
```
