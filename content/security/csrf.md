### CSRF Protection

Cross-site request forgery (CSRF or XSRF) is an attack in which a malicious site makes a user's browser send unwanted, state-changing requests to your application. Because the browser attaches the user's cookies to those requests, the application treats them as if the user had sent them on purpose.

Starting with NestJS v12.1, Nest has built-in CSRF protection. It works the same way on Express and Fastify, and needs no extra package, cookie, session, or change to your client code.

#### How it works

Modern browsers tell the server where each request comes from. They send a [`Sec-Fetch-Site`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site) header (part of Fetch Metadata), which is `same-origin` when one of your own pages made the request, and `same-site` or `cross-site` when another site did. They also send an `Origin` header with cross-origin requests. The built-in protection rejects state-changing requests that the browser reports as cross-origin, following the algorithm of Go 1.25's [`CrossOriginProtection`](https://pkg.go.dev/net/http#CrossOriginProtection).

In detail, each request is checked as follows:

1. `GET`, `HEAD` and `OPTIONS` requests are always allowed.
2. If the request has a `Sec-Fetch-Site` header, the values `same-origin` and `none` (a navigation the user started, such as opening a bookmark) are allowed. Any other value, including `same-site`, is rejected.
3. If the request has neither a `Sec-Fetch-Site` nor an `Origin` header, it is allowed, because it does not come from a browser.
4. Otherwise, the host of the `Origin` header must match the request's `Host` header (`:authority` on HTTP/2). The comparison is case-insensitive and ignores the default port of the scheme, so `https://example.com` matches `example.com:443`. The `X-Forwarded-Host` header is ignored.

A request that would be rejected is still allowed when it matches an [excluded route](/security/csrf#excluding-routes), or when its `Origin` is one of the [trusted origins](/security/csrf#trusted-origins).

#### Getting started

To enable the protection, call the `enableCsrfProtection()` method on the Nest application object:

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableCsrfProtection();
await app.listen(process.env.PORT ?? 3000);
```

The check runs for every request, including requests to routes that do not exist, before Nest middleware, body parsing, guards, interceptors and route handlers. The following rules apply:

- Call `enableCsrfProtection()` before `app.init()` or `app.listen()`. Calling it afterwards, or calling it twice, throws an error.
- Options are validated when you call the method, so a bad configuration fails at startup. For example, a misspelled option throws `Invalid CSRF protection options: unknown option "trustedOrigin" (expected "trustedOrigins", "exclude").`
- The check is registered as a framework-level middleware (Express) or `onRequest` hook (Fastify) at the point where you call the method. Middleware registered with `app.use()` before that call runs first, so call `enableCsrfProtection()` right after `NestFactory.create()`.
- `app.useSecurityHeaders()` (see [Security headers](/security/helmet)) shares the same request hook. You can call the two methods in any order: the headers are always written before the CSRF check runs, so rejected requests carry them too.
- `setGlobalPrefix()` and `enableVersioning()` can be called before or after `enableCsrfProtection()`, because exclusions are resolved when the application initializes.

#### Rejected requests

A rejected request becomes a `ForbiddenException`, which goes through your global [exception filters](/exception-filters) like any other exception. Without a custom filter, the client receives a `403` response like this:

```json
{
  "message": "Cross-origin request detected from Sec-Fetch-Site header",
  "error": "Forbidden",
  "statusCode": 403
}
```

When the request has no `Sec-Fetch-Site` header and its `Origin` does not match `Host`, the message is `Cross-origin request detected, and/or browser is out of date: Sec-Fetch-Site is missing, and Origin does not match Host`.

Since the check runs before routing, controller-scoped filters, guards and interceptors don't run for rejected requests.

#### Options

The `enableCsrfProtection()` method takes an optional options object:

```typescript
app.enableCsrfProtection({
  trustedOrigins: ['https://admin.example.com'],
  exclude: [{ path: 'webhooks/stripe', method: RequestMethod.POST }],
});
```

| Option           | Type                                                      | Description                                                                                  |
| ---------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `trustedOrigins` | `string[]`                                                | Origins that may send cross-origin, state-changing requests. Defaults to none.               |
| `exclude`        | an array of paths and `RouteInfo` objects, or a function  | Requests that skip the check. Consulted only for requests that would otherwise be rejected. |

Any other option is rejected when the method is called.

#### Trusted origins

A frontend served from another origin, such as an admin panel on a sibling subdomain, sends cross-origin requests. The browser reports them as `same-site` or `cross-site`, so they are rejected unless you list the frontend's origin in `trustedOrigins`:

```typescript
app.enableCsrfProtection({
  trustedOrigins: ['https://admin.example.com', 'http://localhost:4200'],
});
```

Each entry must be a serialized origin in the form `scheme://host[:port]`:

- A path (even a trailing `/`), query string, fragment, credentials and wildcards are not allowed. List every origin separately.
- Entries are normalized the way browsers serialize the `Origin` header: lower-case, without the default port. `https://Example.com:443` becomes `https://example.com`.
- A request is exempt when its `Origin` header equals one of the entries exactly.

An invalid entry throws at startup, for example `Invalid trusted origin "https://example.com/": expected "scheme://host[:port]", without a path, query string or fragment.`

> warning **Warning** Origins allowed by [CORS](/security/cors) are not trusted automatically. If a cross-origin frontend sends state-changing requests with credentials, list its origin in `trustedOrigins` too.

#### Excluding routes

Server-to-server requests usually carry neither `Sec-Fetch-Site` nor `Origin`, so they pass the check without any configuration. Exclude a route when it must accept requests with a foreign origin, for example from a webhook sender that sets an `Origin` header, or from an identity provider that sends the user back to your application with a cross-site form `POST` (SAML, or OAuth's `form_post` response mode).

Exclusions are declared like the ones of `MiddlewareConsumer.exclude()` (see [Middleware](/middleware)): as a path, which matches every request method, or as a `RouteInfo` object with a `path`, a `method`, and an optional `version`. Paths are declared without the global prefix:

```typescript
// main.ts
import { RequestMethod } from '@nestjs/common';

app.setGlobalPrefix('api');
app.enableCsrfProtection({
  exclude: [
    // POST /api/webhooks/stripe
    { path: 'webhooks/stripe', method: RequestMethod.POST },
    // POST /api/auth/saml/callback
    { path: 'auth/saml/callback', method: RequestMethod.POST },
  ],
});
```

Exclusions are resolved when the application initializes:

- The [global prefix](/faq/global-prefix) is added, unless the route is excluded from it.
- With [URI versioning](/http/versioning), the version segment of the `version` property is added. The default version is not applied, so set `version` on the exclusion of a versioned route.
- Route parameters and wildcards work as in route paths, for example `webhooks/:provider` or `webhooks/*path`.

Unlike `MiddlewareConsumer.exclude()`, the match is exact, because a lenient match could let a request reach a route that is not excluded:

- Matching is case-sensitive, and a trailing slash does not match. The query string is ignored.
- Non-canonical request paths never match: paths that contain `//`, `.` or `..` segments, `;`, `#`, `\`, or a percent-encoded `.`, `/` or `\`. Such requests go through the check like any other, so the protection fails closed.
- On Fastify, exclusions are matched against the URL before `rewriteUrl` runs, as with `MiddlewareConsumer.exclude()`.

If your Fastify application enables the `ignoreTrailingSlash` or `caseSensitive: false` router options, variants of an excluded path still reach the route but are not excluded, so they are rejected. If clients need such variants, list them explicitly. Because a trailing slash is stripped from an exclusion path, use an optional group to match it:

```typescript
app.enableCsrfProtection({
  exclude: [
    // matches /webhooks/stripe and /webhooks/stripe/
    { path: 'webhooks/stripe{/}', method: RequestMethod.POST },
    // a variant accepted with caseSensitive: false
    { path: 'webhooks/Stripe', method: RequestMethod.POST },
  ],
});
```

Instead of a list, `exclude` also accepts a predicate that receives the platform request object (an Express `Request` or a `FastifyRequest`) and returns `true` to skip the check. It is called only for requests that would otherwise be rejected.

> warning **Warning** A predicate receives the raw request, so none of the matching rules above apply to it. For example, a predicate that tests whether `request.url` starts with `/public/` also skips the check for `/public/../account`, which a router or proxy may resolve to `/account`. Prefer a list of routes where you can.

#### Limitations

- The protection is not a token scheme. It relies on the browser's `Sec-Fetch-Site` header, which browsers only send to secure origins (HTTPS or `localhost`), or on the `Origin` header.
- `GET`, `HEAD` and `OPTIONS` requests are never checked, so handlers for these methods must not change state.
- The `Origin`/`Host` fallback does not know the scheme. For browsers that don't send `Sec-Fetch-Site`, a request from `http://example.com` to `https://example.com` is allowed (fails open), as in Go. [HSTS](/security/helmet#default-headers), which `app.useSecurityHeaders()` sends by default, mitigates this.
- `X-Forwarded-Host` is ignored. Behind a proxy that rewrites the `Host` header, browsers that don't send `Sec-Fetch-Site` hit the fallback and receive a `403`. Configure the proxy to preserve `Host`, or add your public origin to `trustedOrigins`.
- A `403` response does not carry CORS headers when CORS is registered after the protection, which is the case with the `cors` option of `NestFactory.create()`.
- Middleware registered with `app.use()` before `enableCsrfProtection()` runs before the check, and requests that such middleware answers are not checked.
- WebSocket upgrade requests are not checked. If your [gateways](/websockets/gateways) authenticate connections with cookies, validate the handshake's `Origin` header yourself.

#### When you need a token-based approach

CSRF abuses the credentials that a browser attaches to requests automatically, so non-browser clients, such as mobile apps, CLI tools and other servers, don't need CSRF protection. Their requests carry neither `Sec-Fetch-Site` nor `Origin`, and are allowed.

Every evergreen browser has sent `Sec-Fetch-Site` since 2023. Very old browsers that send neither header look like non-browser clients, so their requests are allowed too. If you must protect users of such browsers, add a token-based scheme, as described below.

#### Token-based protection

Token-based schemes store a secret in a cookie or session, and require the client to send a matching token with each state-changing request. They need changes to your client code and a package that depends on the underlying platform.

##### Express

Install the [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf) package:

```bash
$ npm i csrf-csrf
```

Then register its middleware as global middleware. The `doubleCsrf()` function requires the `getSecret` and `getSessionIdentifier` options; the other options have defaults:

```typescript
// main.ts
import { doubleCsrf } from 'csrf-csrf';

const { doubleCsrfProtection } = doubleCsrf(doubleCsrfOptions);
app.use(doubleCsrfProtection);
```

> warning **Warning** As noted in the [csrf-csrf documentation](https://github.com/Psifi-Solutions/csrf-csrf?tab=readme-ov-file#getting-started), this middleware requires session middleware or `cookie-parser` to be initialized beforehand. `doubleCsrf()` also returns a function that generates the tokens your routes hand to clients. Please refer to the documentation for further details.

##### Fastify

Install the [@fastify/csrf-protection](https://github.com/fastify/csrf-protection) package:

```bash
$ npm i @fastify/csrf-protection
```

Then register it as a Fastify plugin:

```typescript
// main.ts
import fastifyCsrf from '@fastify/csrf-protection';

// after registering a storage plugin
await app.register(fastifyCsrf);
```

> warning **Warning** As explained in the [@fastify/csrf-protection documentation](https://github.com/fastify/csrf-protection#usage), this plugin requires a storage plugin (`@fastify/cookie`, `@fastify/session`, or `@fastify/secure-session`) to be registered first.
