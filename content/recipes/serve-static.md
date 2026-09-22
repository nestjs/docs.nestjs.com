### Serve Static

To serve static content, such as a single-page application (SPA), use the `ServeStaticModule` from the [`@nestjs/serve-static`](https://www.npmjs.com/package/@nestjs/serve-static) package.

#### Installation

First, install the required package:

```bash
$ npm install --save @nestjs/serve-static
```

#### Bootstrap

Once the installation is complete, import the `ServeStaticModule` into the root `AppModule` and configure it by passing a configuration object to the `forRoot()` method:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(import.meta.dirname, '..', 'client'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

With this in place, build the static website and place its content in the location specified by the `rootPath` property.

#### Configuration

The [`ServeStaticModule`](https://github.com/nestjs/serve-static) accepts a variety of options to customize its behavior. For example, you can set the path at which the static app is rendered, exclude specific paths, or enable or disable the `Cache-Control` response header. See the [`ServeStaticModuleOptions` interface](https://github.com/nestjs/serve-static/blob/master/lib/interfaces/serve-static-options.interface.ts) for the full list of options.

> warning **Notice** By default, `renderPath` matches all paths, and the module responds with the `index.html` file. This enables client-side routing for your SPA, while routes declared in your controllers are still handled by the server. You can change this behavior by combining the `serveRoot` and `renderPath` options with the other options. With the Fastify adapter, set `serveStaticOptions.fallthrough` to `true` to mimic the Express fallthrough behavior, i.e., to send `index.html` instead of a 404 error for routes that don't exist.

#### Example

A working example is available in the [serve-static sample](https://github.com/nestjs/nest/tree/master/sample/24-serve-static) on GitHub.
