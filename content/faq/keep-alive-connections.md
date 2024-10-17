### Keep alive connections

By default, the HTTP adapters of NestJS will wait until the response is finished before closing the application. But sometimes, this behavior is not desired, or unexpected. There might be some requests that use `Connection: Keep-Alive` headers that live for a long time.

For these scenarios where you always want your application to exit without waiting for requests to end, you can enable the `forceCloseConnections` option when creating your NestJS application.

> warning **Tip** Most users will not need to enable this option. But the symptom of needing this option is that your application will not exit when you expect it to. Usually when `app.enableShutdownHooks()` is enabled and you notice that the application is not restarting/exiting. Most likely while running the NestJS application during development with `--watch`.

#### Usage

In your `main.ts` file, enable the option when creating your NestJS application:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    forceCloseConnections: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```
