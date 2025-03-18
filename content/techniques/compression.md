### Compression

Compression can greatly decrease the size of the response body, thereby increasing the speed of a web app.

For **high-traffic** websites in production, it is strongly recommended to offload compression from the application server - typically in a reverse proxy (e.g., Nginx). In that case, you should not use compression middleware.

#### Use with Express (default)

Use the [compression](https://github.com/expressjs/compression) middleware package to enable gzip compression.

First install the required package:

```bash
$ npm i --save compression
$ npm i --save-dev @types/compression
```

Once the installation is complete, apply the compression middleware as global middleware.

```typescript
import * as compression from 'compression';
// somewhere in your initialization file
app.use(compression());
```

#### Use with Fastify

If using the `FastifyAdapter`, you'll want to use [fastify-compress](https://github.com/fastify/fastify-compress):

```bash
$ npm i --save @fastify/compress
```

Once the installation is complete, apply the `@fastify/compress` middleware as global middleware.

```typescript
import compression from '@fastify/compress';
// somewhere in your initialization file
await app.register(compression);
```

By default, `@fastify/compress` will use Brotli compression (on Node >= 11.7.0) when browsers indicate support for the encoding. While Brotli can be quite efficient in terms of compression ratio, it can also be quite slow. By default, Brotli sets a maximum compression quality of 11, although it can be adjusted to reduce compression time in lieu of compression quality by adjusting the `BROTLI_PARAM_QUALITY` between 0 min and 11 max. This will require fine tuning to optimize space/time performance. An example with quality 4: 

```typescript
import { constants } from 'zlib';
// somewhere in your initialization file
await app.register(compression, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
```

To simplify, you may want to tell `fastify-compress` to only use deflate and gzip to compress responses; you'll end up with potentially larger responses but they'll be delivered much more quickly.

To specify encodings, provide a second argument to `app.register`:

```typescript
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

The above tells `fastify-compress` to only use gzip and deflate encodings, preferring gzip if the client supports both.
