### Rate limiting

A common technique to protect applications from brute-force attacks is **rate-limiting**. Many Express packages exist to provide a rate-limiting feature. A popular one is [express-rate-limit](https://github.com/nfriedly/express-rate-limit).

#### Getting started

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

When there is a load balancer or reverse proxy between the server and the internet, Express may need to be configured to trust the headers set by the proxy in order to get the correct IP for the end user. To do so, first use the `NestExpressApplication` platform [interface](https://docs.nestjs.com/first-steps#platform) when creating your `app` instance, then enable the `trust proxy` setting:

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.set('trust proxy', 1);
```

For more information on `trust proxy` see [here](https://expressjs.com/en/guide/behind-proxies.html).

> info **Hint** If you use the `FastifyAdapter`, use the [fastify-rate-limit](https://github.com/fastify/fastify-rate-limit) package instead.
