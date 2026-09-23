### Security headers

Security headers, such as the ones [Helmet](https://github.com/helmetjs/helmet) sets, tell browsers to turn on protections against well-known web attacks like cross-site scripting and clickjacking. Examples are `Content-Security-Policy`, `Strict-Transport-Security` and `X-Frame-Options`.

Starting with NestJS v12.1, Nest can set these headers for you with `app.useSecurityHeaders()`. It uses the same defaults as Helmet 8, works the same way on Express and Fastify, and needs no extra package.

#### Getting started

To enable the headers, call the `useSecurityHeaders()` method on the Nest application object:

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.useSecurityHeaders();
await app.listen(process.env.PORT ?? 3000);
```

The headers are set on every response: route responses, `404` responses, error responses, responses rejected by the [CSRF protection](/security/csrf), and Server-Sent Events streams. The `X-Powered-By` header is removed. The following rules apply:

- Call `useSecurityHeaders()` before `app.init()` or `app.listen()`. Calling it afterwards, or calling it twice, throws an error.
- Options are validated when you call the method, so a bad configuration fails at startup (see [Configuring headers](/security/helmet#configuring-headers)).
- The headers are written by a framework-level middleware (Express) or `onRequest` hook (Fastify), registered at the point where you call the method. Middleware registered with `app.use()` before that call runs first, and responses that such middleware sends itself don't carry the headers, so call `useSecurityHeaders()` right after `NestFactory.create()`.
- `app.enableCsrfProtection()` shares the same request hook. You can call the two methods in any order: the headers are always written before the CSRF check runs.

#### Default headers

Without options, `useSecurityHeaders()` sends the following headers, with the same values as Helmet 8:

| Header                              | Default value                                                   | Option                          |
| ----------------------------------- | --------------------------------------------------------------- | ------------------------------- |
| `Content-Security-Policy`           | See [Content Security Policy](/security/helmet#content-security-policy) | `contentSecurityPolicy`         |
| `Cross-Origin-Embedder-Policy`      | Not sent                                                        | `crossOriginEmbedderPolicy`     |
| `Cross-Origin-Opener-Policy`        | `same-origin`                                                   | `crossOriginOpenerPolicy`       |
| `Cross-Origin-Resource-Policy`      | `same-origin`                                                   | `crossOriginResourcePolicy`     |
| `Origin-Agent-Cluster`              | `?1`                                                            | `originAgentCluster`            |
| `Referrer-Policy`                   | `no-referrer`                                                   | `referrerPolicy`                |
| `Strict-Transport-Security`         | `max-age=31536000; includeSubDomains`                           | `strictTransportSecurity`       |
| `X-Content-Type-Options`            | `nosniff`                                                       | `xContentTypeOptions`           |
| `X-DNS-Prefetch-Control`            | `off`                                                           | `xDnsPrefetchControl`           |
| `X-Download-Options`                | `noopen`                                                        | `xDownloadOptions`              |
| `X-Frame-Options`                   | `SAMEORIGIN`                                                    | `xFrameOptions`                 |
| `X-Permitted-Cross-Domain-Policies` | `none`                                                          | `xPermittedCrossDomainPolicies` |
| `X-XSS-Protection`                  | `0`                                                             | `xXssProtection`                |
| `X-Powered-By`                      | Removed                                                         | `xPoweredBy`                    |

> info **Hint** Browsers ignore `Strict-Transport-Security` over plain HTTP, and `X-XSS-Protection: 0` turns off the XSS auditor of old browsers, which was a source of vulnerabilities itself.

#### Configuring headers

Each option controls one header. Pass `false` to leave the header out, `true` to send its default value, or an object to configure it:

```typescript
app.useSecurityHeaders({
  xFrameOptions: false,
  strictTransportSecurity: { maxAge: 63072000, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

The options that accept an object take the following properties:

| Option                          | Properties                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contentSecurityPolicy`         | `directives`, `useDefaults` (default `true`) and `reportOnly` (default `false`). See [Content Security Policy](/security/helmet#content-security-policy). |
| `crossOriginEmbedderPolicy`     | `policy`: `'require-corp'` (sent for `true`), `'credentialless'` or `'unsafe-none'`.                                                                  |
| `crossOriginOpenerPolicy`       | `policy`: `'same-origin'` (default), `'same-origin-allow-popups'`, `'noopener-allow-popups'` or `'unsafe-none'`.                                      |
| `crossOriginResourcePolicy`     | `policy`: `'same-origin'` (default), `'same-site'` or `'cross-origin'`.                                                                               |
| `referrerPolicy`                | `policy`: a referrer policy such as `'strict-origin-when-cross-origin'` (default `'no-referrer'`), or a list of policies, which browsers read as a fallback chain. |
| `strictTransportSecurity`       | `maxAge` in seconds (default `31536000`, which is 365 days), `includeSubDomains` (default `true`) and `preload` (default `false`).                     |
| `xDnsPrefetchControl`           | `allow` (default `false`). `true` sends `on`.                                                                                                         |
| `xFrameOptions`                 | `action`: `'sameorigin'` (default) or `'deny'`.                                                                                                       |
| `xPermittedCrossDomainPolicies` | `permittedPolicies`: `'none'` (default), `'master-only'`, `'by-content-type'` or `'all'`.                                                             |

The remaining options, `originAgentCluster`, `xContentTypeOptions`, `xDownloadOptions`, `xPoweredBy` and `xXssProtection`, accept only a boolean. For example, `xPoweredBy: false` keeps the `X-Powered-By` header.

Unknown options, unknown properties and invalid values throw when `useSecurityHeaders()` is called. Helmet's legacy option names are rejected with a hint to the current name, for example `Invalid security headers configuration: unknown option "hsts" (helmet's legacy name, use "strictTransportSecurity").`

A route can still override a header with the [`@Header()`](/controllers#response-headers) decorator, for example to let other sites load an image:

```typescript
@Get('avatars/:id')
@Header('Cross-Origin-Resource-Policy', 'cross-origin')
findAvatar(@Param('id') id: string) {}
```

> info **Hint** On Fastify, `reply.header()` overrides a header as well, but `reply.removeHeader()` cannot remove a header set by `useSecurityHeaders()`.

#### Content Security Policy

The default `Content-Security-Policy` is the same as Helmet 8's. It is sent on one line, without spaces after the semicolons:

```text
default-src 'self';
base-uri 'self';
font-src 'self' https: data:;
form-action 'self';
frame-ancestors 'self';
img-src 'self' data:;
object-src 'none';
script-src 'self';
script-src-attr 'none';
style-src 'self' https: 'unsafe-inline';
upgrade-insecure-requests
```

Use the `directives` property to change it:

```typescript
app.useSecurityHeaders({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", 'https://cdn.example.com'],
      connectSrc: ["'self'", 'wss://realtime.example.com'],
      upgradeInsecureRequests: null,
    },
  },
});
```

Directives work as follows:

- Names are written in camelCase (`scriptSrc`) or in kebab-case (`'script-src'`).
- A directive you set **replaces** the default directive of the same name, so include `'self'` when you want to keep it. Other directives are added to the policy.
- A value is a string or a list of strings. `true` or an empty list sends a directive without a value, and `null` or `false` removes a directive, including a default one.
- Keywords, nonces and hashes must be single-quoted, as in `"'self'"`. An unquoted `self` is rejected, because browsers would read it as a host name.
- Values may only contain printable ASCII characters, and neither `;` nor `,`, so a value cannot add directives or policies.

To send only your own directives, set `useDefaults` to `false`. The policy then needs a `defaultSrc` directive, unless you set `defaultSrc: null` to leave it out on purpose.

To try a policy without breaking pages, set `reportOnly` to `true`. Nest then sends `Content-Security-Policy-Report-Only`, and browsers report violations instead of blocking them. Add a `report-to` or `report-uri` directive to receive the reports.

```typescript
app.useSecurityHeaders({
  contentSecurityPolicy: { reportOnly: true },
});
```

To leave the header out entirely, set `contentSecurityPolicy` to `false`.

#### Swagger UI and GraphQL IDEs

The policy applies to every response, including the HTML pages of API tools.

The [Swagger UI](/openapi/introduction) served by `@nestjs/swagger` loads its scripts and stylesheets from your application, so it works with the default policy. If you add scripts with the `customJs` option, add their hosts to `scriptSrc`. Inline code from the `customJsStr` option requires `'unsafe-inline'`. The default `upgrade-insecure-requests` directive makes browsers load scripts and stylesheets over HTTPS, so if you serve Swagger UI over plain HTTP outside local development, for example on a staging server reached by IP address, they fail to load. Serve Swagger UI over HTTPS, or remove the directive with `upgradeInsecureRequests: null`.

[GraphiQL](/graphql/quick-start#graphql-ide), as served by the Apollo driver, loads React and GraphiQL from `unpkg.com` and starts with an inline script. By default, GraphiQL is only enabled when `NODE_ENV` is not `production`, so relax the policy only there:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

app.useSecurityHeaders({
  contentSecurityPolicy: isProduction
    ? true
    : {
        directives: {
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        },
      },
});
```

[Apollo Sandbox](/graphql/quick-start#apollo-sandbox), enabled with `ApolloServerPluginLandingPageLocalDefault()`, loads its scripts, images and manifest from Apollo's CDN, and embeds the Sandbox in a frame:

```typescript
app.useSecurityHeaders({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://embeddable-sandbox.cdn.apollographql.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https://apollo-server-landing-page.cdn.apollographql.com',
      ],
      manifestSrc: [
        "'self'",
        'https://apollo-server-landing-page.cdn.apollographql.com',
      ],
      frameSrc: ["'self'", 'https://sandbox.embed.apollographql.com'],
    },
  },
});
```

> warning **Warning** `'unsafe-inline'` in `script-src` gives up most of the protection that CSP offers against cross-site scripting, for every page your application serves. Avoid it in production.

#### Using Helmet directly

Applications that already use Helmet can keep using it. Since the option names of `useSecurityHeaders()` are the same as Helmet's, a Helmet configuration usually carries over when you switch, with two exceptions:

- CSP directive values must be strings, lists of strings, booleans or `null`. Functions, which Helmet accepts to generate per-request nonces, are not supported.
- Helmet's legacy option names are rejected:

| Legacy Helmet name             | Option                          |
| ------------------------------ | ------------------------------- |
| `dnsPrefetchControl`           | `xDnsPrefetchControl`           |
| `frameguard`                   | `xFrameOptions`                 |
| `hidePoweredBy`                | `xPoweredBy`                    |
| `hsts`                         | `strictTransportSecurity`       |
| `ieNoOpen`                     | `xDownloadOptions`              |
| `noSniff`                      | `xContentTypeOptions`           |
| `permittedCrossDomainPolicies` | `xPermittedCrossDomainPolicies` |
| `xssFilter`                    | `xXssProtection`                |

To use Helmet itself, install the package for your platform and register it before other calls to `app.use()` or setup functions that may call `app.use()`. The underlying platform applies middleware in the order it was registered, so Helmet registered after a route doesn't apply to that route. The CSP directives shown above work with Helmet's `contentSecurityPolicy` option as well.

##### Express

```bash
$ npm i helmet
```

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

##### Fastify

With the `FastifyAdapter`, use the [@fastify/helmet](https://github.com/fastify/fastify-helmet) package. It is a [Fastify plugin](https://fastify.dev/docs/latest/Reference/Plugins/), not a middleware, so register it with `app.register()`:

```bash
$ npm i @fastify/helmet
```

```typescript
// main.ts
import helmet from '@fastify/helmet';

await app.register(helmet);
```
