### Compression

Compression can greatly decrease the size of the response body, thereby increasing the speed of a web app. Use the [compression](https://github.com/expressjs/compression) middleware package to enable gzip compression.

#### Installation

First install the required package:

```bash
$ npm i --save compression
```

Once the installation is complete, apply the compression middleware as global middleware.

```typescript
import * as compression from 'compression';
// somewhere in your initialization file
app.use(compression());
```

> info **Hint** If using the `FastifyAdapter`, consider using [fastify-compress](https://github.com/fastify/fastify-compress) instead.

For **high-traffic** websites in production, it is strongly recommended to offload compression from the application server - typically in a reverse proxy (e.g., Nginx). In that case, you should not use compression middleware.
