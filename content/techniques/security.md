### Security

In this chapter you will learn some techniques that will allow you to increase the security of your applications.

#### Helmet

[Helmet](https://github.com/helmetjs/helmet) can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately. Generally, Helmet is just a collection of 12 smaller middleware functions that set security-related HTTP headers (read [more](https://github.com/helmetjs/helmet#how-it-works)). Firstly, install the required package:

```bash
$ npm i --save helmet
```

Once the installation is completed, apply it as a global middleware.

```typescript
import * as helmet from 'helmet';
// somewhere in your initialization file
app.use(helmet());
```

#### CORS

Cross-origin resource sharing (CORS) is a mechanism that allows resources to be requested from another domain. Under the hood, Nest makes use of [cors](https://github.com/expressjs/cors) package, that provides a bunch of options that you may customize based on your requirements. In order to enable CORS, you have to call `enableCors()` method.

```typescript
const app = await NestFactory.create(ApplicationModule);
app.enableCors();
await app.listen(3000);
```

Also, you can pass a configuration object as a parameter of this function. The available properties are exhaustively described in the official [cors](https://github.com/expressjs/cors) repository. A different way is to use a Nest options object:

```typescript
const app = await NestFactory.create(ApplicationModule, { cors: true });
await app.listen(3000);
```

Instead of passing a boolean value, you can use a cors configuration object as well (read [more](https://github.com/expressjs/cors#configuration-options)).

#### CSRF

Cross-site request forgery (known as CSRF or XSRF) is a type of malicious exploit of a website where **unauthorized** commands are transmitted from a user that the web application trusts. To mitigate this kind of attacks you can use the [csurf](https://github.com/expressjs/csurf) package. Firstly, install the required package:

```bash
$ npm i --save csurf
```

Once the installation is completed, apply it as a global middleware.

```typescript
import * as csurf from 'csurf';
// somewhere in your initialization file
app.use(csurf());
```

#### Rate limiting

To protect your applications from brute-force attacks, you have to implement some kind of rate-limiting. Luckily, there is a bunch of various middleware available on the NPM already. One of them is [express-rate-limit](https://github.com/nfriedly/express-rate-limit).

```bash
$ npm i --save express-rate-limit
```

Once the installation is completed, apply it as a global middleware.

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

> info **Hint** If you work with `FastifyAdapter`, consider using [fastify-rate-limit](https://github.com/fastify/fastify-rate-limit) instead.

#### Brute-force prevention

 Prevent brute-force attacks against authorization.
A simple and powerful technique is to block authorization attempts using two metrics:

 1. The first is number of consecutive failed attempts by the same user name and IP address.
1. The second is number of failed attempts from an IP address over some long period of time. For example, block an IP address if it makes 100 failed attempts in one day.

 [rate-limiter-flexible](https://github.com/animir/node-rate-limiter-flexible) package provides tools to make this technique easy and fast. You can find [an example of brute-force protection in the documentation](https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#login-endpoint-protection)
