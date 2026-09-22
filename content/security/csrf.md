### CSRF Protection

Cross-site request forgery (CSRF or XSRF) is a type of attack in which **unauthorized** commands are sent to a web application on behalf of a user it trusts. To help prevent this, you can use the [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf) package.

#### Use with Express (default)

Start by installing the required package:

```bash
$ npm i csrf-csrf
```

> warning **Warning** As noted in the [csrf-csrf documentation](https://github.com/Psifi-Solutions/csrf-csrf?tab=readme-ov-file#getting-started), this middleware requires the `cookie-parser` middleware to be registered before it. See that documentation for further details.

Once the installation is complete, register the `csrf-csrf` middleware as global middleware. The `doubleCsrf()` function requires the `getSecret` and `getSessionIdentifier` options; the other options have defaults.

```typescript
import { doubleCsrf } from 'csrf-csrf';
// ...
// somewhere in your initialization file
const {
  invalidCsrfTokenError, // Provided for convenience if you plan on creating your own middleware.
  generateCsrfToken, // Use this in your routes to generate a CSRF token and set the token cookie.
  validateRequest, // Also a convenience if you plan on creating your own middleware.
  doubleCsrfProtection, // The default CSRF protection middleware.
} = doubleCsrf(doubleCsrfOptions);
app.use(doubleCsrfProtection);
```

#### Use with Fastify

Start by installing the required package:

```bash
$ npm i --save @fastify/csrf-protection
```

Once the installation is complete, register the `@fastify/csrf-protection` plugin, as follows:

```typescript
import fastifyCsrf from '@fastify/csrf-protection';
// ...
// somewhere in your initialization file, after registering a storage plugin
await app.register(fastifyCsrf);
```

> warning **Warning** As explained in the [`@fastify/csrf-protection` usage docs](https://github.com/fastify/csrf-protection#usage), this plugin requires a storage plugin (`@fastify/cookie`, `@fastify/session`, or `@fastify/secure-session`) to be registered first. See that documentation for further instructions.
