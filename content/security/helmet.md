### Helmet

[Helmet](https://github.com/helmetjs/helmet) can help protect your app from some well-known web vulnerabilities by setting HTTP response headers appropriately. Helmet is a collection of smaller middleware functions that set security-related HTTP headers (see the [Helmet documentation](https://helmet.js.org/)).

> info **Hint** Apply `helmet` globally, before any other calls to `app.use()` or setup functions that may call `app.use()`. In the underlying platform (Express or Fastify), the order in which middleware and routes are defined matters: middleware such as `helmet` or `cors` applies only to routes defined after it, not to routes defined before it.

#### Use with Express (default)

Start by installing the required package:

```bash
$ npm i --save helmet
```

Once the installation is complete, apply it as global middleware:

```typescript
import helmet from 'helmet';
// somewhere in your initialization file
app.use(helmet());
```

> warning **Warning** When you use `helmet` with `@apollo/server` and the [Apollo Sandbox](/graphql/quick-start#apollo-sandbox), the default [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) may prevent the Apollo Sandbox from loading. To solve this, configure the CSP as shown below:
>
> ```typescript
> app.use(helmet({
>   crossOriginEmbedderPolicy: false,
>   contentSecurityPolicy: {
>     directives: {
>       imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>       manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
>       frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
>     },
>   },
> }));
> ```

#### Use with Fastify

If you are using the `FastifyAdapter`, install the [@fastify/helmet](https://github.com/fastify/fastify-helmet) package:

```bash
$ npm i --save @fastify/helmet
```

Register `@fastify/helmet` as a [Fastify plugin](https://www.fastify.io/docs/latest/Reference/Plugins/) with `app.register()`, not as middleware:

```typescript
import helmet from '@fastify/helmet';
// somewhere in your initialization file
await app.register(helmet);
```

> warning **Warning** When you use `apollo-server-fastify` with `@fastify/helmet`, the default [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) may block the GraphQL playground. To solve this, configure the CSP as shown below:
>
> ```typescript
> await app.register(helmet, {
>    contentSecurityPolicy: {
>      directives: {
>        defaultSrc: [`'self'`, 'unpkg.com'],
>        styleSrc: [
>          `'self'`,
>          `'unsafe-inline'`,
>          'cdn.jsdelivr.net',
>          'fonts.googleapis.com',
>          'unpkg.com',
>        ],
>        fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
>        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
>        scriptSrc: [
>          `'self'`,
>          `https: 'unsafe-inline'`,
>          `cdn.jsdelivr.net`,
>          `'unsafe-eval'`,
>        ],
>      },
>    },
>  });
>
> // If you are not going to use CSP at all, disable it:
> await app.register(helmet, {
>   contentSecurityPolicy: false,
> });
> ```
