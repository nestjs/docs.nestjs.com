### Keep alive connections

By default, the NestJS HTTP adapters wait until responses have finished before closing the application. Sometimes this behavior is unwanted or unexpected: some requests use `Connection: Keep-Alive` headers and keep their connections open for a long time.

If you want your application to always exit without waiting for these connections to end, enable the `forceCloseConnections` option when creating your NestJS application.

> info **Hint** Most users don't need this option. The typical symptom that you do is an application that doesn't exit when you expect it to, usually with `app.enableShutdownHooks()` enabled, and most often during development when running with `--watch`.

#### Usage

In your `main.ts` file, enable the option when creating your NestJS application:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
```

> info **Note** Both the Express and the Fastify adapter implement the `forceCloseConnections` application option. With Fastify, this requires NestJS v12.1 or later. In earlier versions, pass Fastify's own `forceCloseConnections` server option to the `FastifyAdapter` constructor instead.
