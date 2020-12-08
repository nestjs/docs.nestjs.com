### CSRF Protection

Cross-site request forgery (also known as CSRF or XSRF) is a type of malicious exploit of a website where **unauthorized** commands are transmitted from a user that the web application trusts. To mitigate this kind of attack you can use the [csurf](https://github.com/expressjs/csurf) package.

#### Use with Express (default)

Start by installing the required package:

```bash
$ npm i --save csurf
```

> warning **Warning** As explained on the [csurf middleware page](https://github.com/expressjs/csurf#csurf), the csurf module requires either session middleware or a cookie-parser to be initialized first. Please see that documentation for further instructions.

Once the installation is complete, apply the csurf middleware as global middleware.

```typescript
import * as csurf from 'csurf';
// somewhere in your initialization file
app.use(csurf());
```

#### Use with Fastify

Start by installing the required package:

```bash
$ npm i --save fastify-csrf
```

Once the installation is complete, register the `fastify-csrf` plugin, as follows:

```typescript
import fastifyCsrf from 'fastify-csrf';
// somewhere in your initialization file
app.register(fastifyCsrf);
```
