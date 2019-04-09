### Performance (Fastify)

Under the hood, Nest makes use of [Express](https://expressjs.com/), but as mentioned already, provides compatibility with a wide range of other libraries, like e.g. [Fastify](https://github.com/fastify/fastify). How does it work? In fact, what Nest needs to use your favorite library, is a compatible adapter, that primarily proxies corresponding handlers to appropriate library-specific methods. Additionally, your library has to provide at least similar request-response cycle management as express.

A [Fastify](https://github.com/fastify/fastify) fits here very well because it solves design issues in a similar manner as express does. However, fastify is much **faster**, achieving almost two times better benchmarks results. The question, why Nest still uses express as a default HTTP provider then? Because express is widely-used, well-known, and has a huge set of compatible middleware.

But we don't lock people in a single paradigm. We let them use whatever they need. Fastify is a better choice when you care about really good performance, that's why we provide a built-in `FastifyAdapter` that helps to integrate this library with Nest.

#### Installation

Firstly, we need to install required package:

```bash
$ npm i --save @nestjs/platform-fastify
```

#### Adapter

Once fastify platform is installed, we can use the `FastifyAdapter`.

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    ApplicationModule,
    new FastifyAdapter(),
  );
  await app.listen(3000);
}
bootstrap();
```

If you're running your Nest instance inside of a **docker container** you will need to specify the host, like so:

```typescript
await app.listen(3000, '0.0.0.0');
```

And that's all. Also, you are able to pass options into fastify constructor through `FastifyAdapter` constructor. Keep in mind that now, Nest uses fastify as an **HTTP provider**, meaning, each recipe that relays on express won't work anymore. You should rather use fastify equivalent packages.

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/10-fastify).
