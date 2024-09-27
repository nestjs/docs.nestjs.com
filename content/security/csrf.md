### CSRF Protection

Cross-site request forgery (also known as CSRF or XSRF) is a type of malicious exploit of a website where **unauthorized** commands are transmitted from a user that the web application trusts. To mitigate this kind of attack you can use the [ncsrf](https://www.npmjs.com/package/ncsrf) package.

#### Use with Express (default)

Requires either a **session middleware** or **cookie-parser** to be initialized first, and need enableCors.

```typescript
app.use(cookieParser());
```

Start by installing the required package:

```bash
$ npm install ncsrf --save
```

or

```bash
$ yarn add ncsrf
```

Once the installation is complete, apply the `ncsrf` middleware as global middleware.

```typescript
import { nestCsrf, CsrfFilter } from 'ncsrf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(nestCsrf());
```

**nestCsrf([options])**

- signed - indicates if the cookie should be signed (defaults to false).
- key - the name of the cookie to use to store the token secret (defaults to '\_csrf').
- ttl - The time to live of the cookie use to store the token secret (default 300s).

**Generate token here**

```typescript
  @Get('/token')
  getCsrfToken(@Req() req): any {
    return {
      token: req.csrfToken()
    }
  }
```

**Protected route with csrf**

```typescript
  // import {CsrfQL} from "ncsrf"; // for graphql
  import {Csrf} from "ncsrf";
  ...
  @Post()
  @Csrf()
  needProtect(): string{
    return "Protected!";
  }
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
// somewhere in your initialization file after registering some storage plugin
await app.register(fastifyCsrf);
```

> warning **Warning** As explained in the `@fastify/csrf-protection` docs [here](https://github.com/fastify/csrf-protection#usage), this plugin requires a storage plugin to be initialized first. Please, see that documentation for further instructions.
