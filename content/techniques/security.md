### Security

In this chapter we cover various techniques that help you to increase the security of your applications.

#### Helmet

[Helmet](https://github.com/helmetjs/helmet) can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately. Generally, Helmet is just a collection of 14 smaller middleware functions that set security-related HTTP headers (read [more](https://github.com/helmetjs/helmet#how-it-works)).

Start by installing the required package:

```bash
$ npm i --save helmet
```

Once the installation is complete, apply it as a global middleware.

```typescript
import * as helmet from 'helmet';
// somewhere in your initialization file
app.use(helmet());
```

> info **Hint** Note that `app.use(helmet())` must come before other calls to `app.use()` or setup functions that may call `app.use()`). This is due to the way the underlying platform (e.g., Express) works, where the order that middleware/routes are defined matters. If you use middleware like `helmet` or `cors` after you define a route, then that middleware will not apply to that route, it will only apply to middleware defined after the route.

#### CORS

Cross-origin resource sharing (CORS) is a mechanism that allows resources to be requested from another domain. Under the hood, Nest makes use of the Express [cors](https://github.com/expressjs/cors) package. This package provides various options that you can customize based on your requirements. To enable CORS, call the `enableCors()` method on the Nest application object.

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(3000);
```

The `enableCors()` method takes an optional configuration object argument. The available properties of this object are described in the official [CORS](https://github.com/expressjs/cors#configuration-options) documentation.

Alternatively, enable CORS via the `create()` method's options object. Set the `cors` property to `true` to enable CORS with default settings. Alternatively, pass a [CORS configuration object](https://github.com/expressjs/cors#configuration-options) as the `cors` property value to customize its behavior.

```typescript
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(3000);
```

#### CSRF

Cross-site request forgery (also known as CSRF or XSRF) is a type of malicious exploit of a website where **unauthorized** commands are transmitted from a user that the web application trusts. To mitigate this kind of attack you can use the [csurf](https://github.com/expressjs/csurf) package.

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

#### Rate limiting

A common technique to protect applications from brute-force attacks is **rate-limiting**. Many Express packages exist to provide a rate-limiting feature. A popular one is [express-rate-limit](https://github.com/nfriedly/express-rate-limit).

Start by installing the required package:

```bash
$ npm i --save express-rate-limit
```

Once the installation is complete, apply the rate-limiter as global middleware.

```typescript
import * as rateLimit from 'express-rate-limit';
// somewhere in your initialization file
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
```

When there is a load balancer or reverse proxy between the server and the internet, Express may need to be configured to trust the headers set by the proxy in order to get the correct IP for the end user. To do so, first use the `NestExpressApplication` platform [interface](https://docs.nestjs.com/first-steps#platform) when creating your `app` instance, then enable the [trust proxy](https://expressjs.com/en/guide/behind-proxies.html) setting:

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
// see https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);
```

> info **Hint** If you use the `FastifyAdapter`, consider using [fastify-rate-limit](https://github.com/fastify/fastify-rate-limit) instead.
