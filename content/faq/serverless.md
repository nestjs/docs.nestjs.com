### Serverless

Serverless computing is a cloud computing execution model in which the cloud provider allocates machine resources on demand, managing the servers on behalf of its customers. When an app is not in use, no computing resources are allocated to it. Pricing is based on the actual amount of resources the application consumes ([source](https://en.wikipedia.org/wiki/Serverless_computing)).

With a **serverless architecture**, you focus on the individual functions in your application code. Services such as AWS Lambda, Google Cloud Functions, and Microsoft Azure Functions manage the physical hardware, the virtual machine operating system, and the web server software.

> info **Hint** This chapter doesn't cover the pros and cons of serverless functions, nor does it dive into the specifics of any cloud provider.

#### Cold start

A cold start is the first time your code runs in a while. Depending on your cloud provider, it may span several operations, from downloading the code and bootstrapping the runtime to running your code.
This process adds **significant latency**, depending on several factors such as the language and the number of packages your application requires.

Some of these factors are beyond your control, but there's still a lot you can do on your side to keep the cold start as short as possible.

While Nest is a fully-fledged framework designed for complex enterprise applications, it is also **suitable for much "simpler" applications** (or scripts). For example, with the [standalone applications](/standalone-applications) feature, you can use Nest's DI system in simple workers, CRON jobs, CLIs, or serverless functions.

#### Benchmarks

To better understand the cost of using Nest or other well-known libraries (like `express`) in serverless functions, let's compare how much time the Node.js runtime needs to run the following scripts:

```typescript
// #1 Express
import express from 'express';

async function bootstrap() {
  const app = express();
  app.get('/', (req, res) => res.send('Hello world!'));
  await new Promise<void>((resolve) => app.listen(3000, resolve));
}
await bootstrap();

// #2 Nest (with @nestjs/platform-express)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

// #3 Nest as a Standalone application (no HTTP server)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppService } from './app.service.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  console.log(app.get(AppService).getHello());
}
await bootstrap();

// #4 Raw Node.js script
async function bootstrap() {
  console.log('Hello world!');
}
await bootstrap();
```

For all these scripts, we used the `tsc` (TypeScript) compiler, so the code remains unbundled (`webpack` isn't used).

|                                      |                   |
| ------------------------------------ | ----------------- |
| Express                              | 0.0079s (7.9ms)   |
| Nest with `@nestjs/platform-express` | 0.1974s (197.4ms) |
| Nest (standalone application)        | 0.1117s (111.7ms) |
| Raw Node.js script                   | 0.0071s (7.1ms)   |

> info **Note** Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

Now, let's repeat all benchmarks, this time using `webpack` to bundle the application into a single executable JavaScript file (if you have the [Nest CLI](/cli/overview) installed, run `nest build --webpack`).
Instead of the default `webpack` configuration that the Nest CLI ships with, we'll bundle all dependencies (`node_modules`) together, as follows:

```javascript
module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
```

> info **Hint** To make the Nest CLI use this configuration, create a `webpack.config.js` file in the root directory of your project.

With this configuration, we got the following results:

|                                      |                  |
| ------------------------------------ | ---------------- |
| Express                              | 0.0068s (6.8ms)  |
| Nest with `@nestjs/platform-express` | 0.0815s (81.5ms) |
| Nest (standalone application)        | 0.0319s (31.9ms) |
| Raw Node.js script                   | 0.0066s (6.6ms)  |

> info **Note** Machine: MacBook Pro Mid 2014, 2.5 GHz Quad-Core Intel Core i7, 16 GB 1600 MHz DDR3, SSD.

> info **Hint** You can optimize it even further with additional code minification and optimization techniques (e.g., using `webpack` plugins).

The way you compile your code (and whether you bundle it) has a significant impact on the overall startup time. With `webpack`, you can get the bootstrap time of a standalone Nest application (a starter project with one module, controller, and service) down to ~32ms on average, and down to ~81.5ms for a regular HTTP, Express-based NestJS app.

For a more complex Nest application, for example, one with 10 resources generated with the `$ nest g resource` schematic (10 modules, 10 controllers, 10 services, 20 DTO classes, and 50 HTTP endpoints, plus `AppModule`), the overall startup on the same machine takes approximately 0.1298s (129.8ms). Running a monolithic application as a serverless function rarely makes sense anyway, so treat this benchmark as an example of how the bootstrap time may increase as your application grows.

#### Runtime optimizations

So far, we've covered compile-time optimizations. These are unrelated to the way you define providers and load Nest modules in your application, which plays an essential role as your application grows.

For example, imagine a database connection defined as an [asynchronous provider](/fundamentals/async-providers). Async providers are designed to delay the application start until one or more asynchronous tasks complete.
If your serverless function needs 2s on average to connect to the database on bootstrap, your endpoint needs at least two extra seconds to send a response on a cold start, because it must wait until the connection is established.

In a **serverless environment**, where bootstrap time matters, you structure your providers somewhat differently.
For example, if you use Redis for caching only in certain scenarios, you probably shouldn't define the Redis connection as an async provider: it would slow down bootstrap even for function invocations that don't need it.

You can also lazy load entire modules with the `LazyModuleLoader` class, as described in the [lazy-loading modules](/fundamentals/lazy-loading-modules) chapter. Caching is a good example here too.
Imagine that your application has a `CacheModule` that connects to Redis and exports a `CacheService` for interacting with the Redis storage. If not every function invocation needs it,
you can load it lazily, on demand. This way, all invocations that don't require caching get a faster startup time on a cold start.

```typescript
if (request.method === RequestMethod[RequestMethod.GET]) {
  const { CacheModule } = await import('./cache.module.js');
  const moduleRef = await this.lazyModuleLoader.load(() => CacheModule);

  const { CacheService } = await import('./cache.service.js');
  const cacheService = moduleRef.get(CacheService);

  return cacheService.get(ENDPOINT_KEY);
}
```

Another example is a webhook or worker that performs different operations depending on specific conditions (e.g., input arguments).
In this case, you can add a condition inside your route handler that lazily loads the appropriate module for the specific function invocation, and load every other module lazily as well.

```typescript
if (workerType === WorkerType.A) {
  const { WorkerAModule } = await import('./worker-a.module.js');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerAModule);
  // ...
} else if (workerType === WorkerType.B) {
  const { WorkerBModule } = await import('./worker-b.module.js');
  const moduleRef = await this.lazyModuleLoader.load(() => WorkerBModule);
  // ...
}
```

#### Example integration

What your application's entry file (typically `main.ts`) should look like **depends on several factors**, so **there's no single template** that works for every scenario.
For example, the initialization file required to spin up your serverless function varies by cloud provider (AWS, Azure, GCP, etc.).
Also, your application's code looks different depending on whether you want to run a typical HTTP application with multiple routes/endpoints or provide a single route (or execute a specific portion of code).
For example, for the endpoint-per-function approach, you could use `NestFactory.createApplicationContext()` instead of booting the HTTP server, setting up middleware, etc.

For illustration purposes, we'll integrate Nest (using `@nestjs/platform-express`, and therefore spinning up the whole, fully functional HTTP router)
with the [Serverless](https://www.serverless.com/) framework (in this case, targeting AWS Lambda). As mentioned earlier, your code will differ depending on the cloud provider you choose, among many other factors.

First, install the required packages:

```bash
$ npm i @codegenie/serverless-express
$ npm i -D @types/aws-lambda serverless-offline
```

> info **Hint** To speed up development cycles, we install the `serverless-offline` plugin, which emulates AWS Lambda and API Gateway locally.

Once the installation is complete, create the `serverless.yml` file to configure the Serverless framework:

```yaml
service: serverless-example

plugins:
  - serverless-offline

provider:
  name: aws
  runtime: nodejs22.x

functions:
  main:
    handler: dist/main.handler
    events:
      - http:
          method: ANY
          path: /
      - http:
          method: ANY
          path: '{proxy+}'
```

> info **Hint** To learn more about the Serverless framework, visit the [official documentation](https://www.serverless.com/framework/docs/).

With this in place, open the `main.ts` file and update the bootstrap code with the required boilerplate:

```typescript
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import type { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module.js';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
```

> info **Hint** To create multiple serverless functions that share common modules, we recommend using the [CLI monorepo mode](/cli/monorepo#monorepo-mode).

> warning **Warning** If you use the `@nestjs/swagger` package, serving the Swagger UI from a serverless function requires one extra step. Behind API Gateway, the request's `originalUrl` may lack the trailing slash Swagger UI expects, which causes an endless redirect loop. Register a middleware that restores it **before** calling `SwaggerModule.setup()`:
>
> ```typescript
> app.use((req, res, next) => {
>   if (req.originalUrl === '/swagger') {
>     req.originalUrl = '/swagger/';
>   }
>   next();
> });
> ```

Next, make sure the `esModuleInterop` option is enabled in your `tsconfig.json` file so that the `@codegenie/serverless-express` package loads properly (projects generated with `nest new` enable it by default).

```json
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  }
}
```

Now build the application (with `nest build` or `tsc`) and use the `serverless` CLI to start the Lambda function locally:

```bash
$ npm run build
$ npx serverless offline
```

Once the application is running, open your browser and navigate to `http://localhost:3000/dev/[ANY_ROUTE]`, where `[ANY_ROUTE]` is any endpoint registered in your application.

The sections above show that bundling your app with `webpack` can have a significant impact on the overall bootstrap time.
To make it work with this example, add a few more settings to your `webpack.config.js` file. In particular,
to make sure the `handler` function is picked up, set the `output.libraryTarget` property to `commonjs2`.

```javascript
return {
  ...options,
  externals: [],
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
```

With this in place, run `$ nest build --webpack` to compile your function's code (and then `$ npx serverless offline` to test it).

We also recommend (but **don't require**, as it slows down the build) installing the `terser-webpack-plugin` package and overriding its configuration to keep class names intact when minifying your production build. Otherwise, `class-validator` may behave incorrectly in your application.

```javascript
const TerserPlugin = require('terser-webpack-plugin');

return {
  ...options,
  externals: [],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  output: {
    ...options.output,
    libraryTarget: 'commonjs2',
  },
  // ... the rest of the configuration
};
```

#### Using standalone application feature

Alternatively, if you want to keep your function lightweight and don't need any HTTP-related features (routing, but also guards, interceptors, pipes, etc.),
use `NestFactory.createApplicationContext()` (as mentioned earlier) instead of running the entire HTTP server (and `express` under the hood):

```typescript
@@filename(main)
import { HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module.js';
import { AppService } from './app.service.js';

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appService = appContext.get(AppService);

  return {
    body: appService.getHello(),
    statusCode: HttpStatus.OK,
  };
};
```

> info **Hint** `NestFactory.createApplicationContext()` doesn't wrap controller methods with enhancers (guards, interceptors, etc.). If you need enhancers, use the `NestFactory.create()` method.

You could also pass the `event` object to a provider, such as an `EventsService`, that processes it and returns a corresponding value (depending on the input and your business logic).

```typescript
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const eventsService = appContext.get(EventsService);
  return eventsService.process(event);
};
```
