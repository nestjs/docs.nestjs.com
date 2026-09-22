### Session

**HTTP sessions** store information about the user across multiple requests, which is particularly useful for [MVC](/http/mvc) applications.

#### Use with Express (default)

First, install the [express-session](https://github.com/expressjs/session) package (and its types, for TypeScript users):

```shell
$ npm i express-session
$ npm i -D @types/express-session
```

Once the installation is complete, apply the `express-session` middleware as global middleware (for example, in your `main.ts` file):

```typescript
import session from 'express-session';
// somewhere in your initialization file
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
  }),
);
```

> warning **Notice** The default server-side session storage is purposely not designed for a production environment. It leaks memory under most conditions, does not scale past a single process, and is meant for debugging and development. Read more in the [express-session repository](https://github.com/expressjs/session).

The `secret` is used to sign the session ID cookie. It can be either a string (a single secret) or an array of secrets. If you provide an array, only the first element is used to sign the session ID cookie, while all elements are considered when verifying the signature in requests. The secret should not be easily guessed; a random set of characters works best.

Enabling the `resave` option forces the session to be saved back to the session store, even if the session was never modified during the request. The default value is `true`, but relying on the default is deprecated because the default will change in the future.

Likewise, enabling the `saveUninitialized` option forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified. Choosing `false` is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing `false` also helps with race conditions where a client makes multiple parallel requests without a session (see the [`saveUninitialized` documentation](https://github.com/expressjs/session#saveuninitialized)).

The `session` middleware accepts several other options. Read more about them in the [express-session API documentation](https://github.com/expressjs/session#options).

> info **Hint** The `cookie.secure: true` option is recommended. However, it requires an HTTPS-enabled website, because secure cookies are only sent over HTTPS. If `secure` is set and you access your site over HTTP, the cookie is not set. If your Node.js server runs behind a proxy and you use `secure: true`, you need to set `"trust proxy"` in Express.

With this in place, you can set and read session values from within route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
```

> info **Hint** The `@Req()` decorator is imported from the `@nestjs/common` package, while `Request` is imported from the `express` package.

Alternatively, you can use the `@Session()` decorator to extract a session object from the request, as follows:

```typescript
@Get()
findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
```

> info **Hint** The `@Session()` decorator is imported from the `@nestjs/common` package.

#### Use with Fastify

First, install the required package:

```shell
$ npm i @fastify/secure-session
```

Once the installation is complete, register the `@fastify/secure-session` plugin:

```typescript
import secureSession from '@fastify/secure-session';

// somewhere in your initialization file
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(secureSession, {
  secret: 'averylogphrasebiggerthanthirtytwochars',
  salt: 'mq9hDxBVDbspDR6n',
});
```

> info **Hint** You can also [pregenerate a key](https://github.com/fastify/fastify-secure-session) or use [key rotation](https://github.com/fastify/fastify-secure-session#using-keys-with-key-rotation).

Read more about the available options in the [@fastify/secure-session repository](https://github.com/fastify/fastify-secure-session).

With this in place, you can set and read session values from within route handlers, as follows:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
```

Alternatively, you can use the `@Session()` decorator to extract a session object from the request, as follows:

```typescript
@Get()
findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
```

> info **Hint** The `@Session()` decorator is imported from the `@nestjs/common` package, while `secureSession.Session` comes from the `@fastify/secure-session` package (import statement: `import * as secureSession from '@fastify/secure-session'`).
