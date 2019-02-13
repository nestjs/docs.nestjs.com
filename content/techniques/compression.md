### Compression

Compression can greatly decrease the size of the response body and hence increase the speed of a web app. Use the [compression](https://github.com/expressjs/compression) middleware to enable gzip compression.

#### Installation

Firstly, install the required package:

```bash
$ npm i --save compression
```

Once the installation is completed, apply it as a global middleware.

```typescript
import * as compression from 'compression';
// somewhere in your initialization file
app.use(compression());
```

> info **Hint** If you work with `FastifyAdapter`, consider using [fastify-compress](https://github.com/fastify/fastify-compress) instead.

For a **high-traffic** website in production, the best way to put compression in place is to implement it at a reverse proxy level. In that case, you do not need to use compression middleware.
