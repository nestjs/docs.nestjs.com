### Apitally

[Apitally](https://apitally.io/nestjs) is a simple API monitoring and analytics tool. It integrates with NestJS via a lightweight middleware and provides:

- Real-time metrics for API usage, errors, and performance
- Request and application logs with automatic correlation
- Uptime monitoring and alerting

#### Installation

First, install the required dependency:

```bash
$ npm install apitally
```

#### Basic setup

Then, add the middleware to your NestJS app using the `useApitally` function and provide your client ID.
You can get your client ID by creating a new app in the Apitally dashboard.

```typescript
import { NestFactory } from "@nestjs/core";
import { useApitally } from "apitally/nestjs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await useApitally(app, {
    clientId: "your-client-id",
    env: "dev", // or "prod" etc.
  });

  // ...
}

bootstrap();
```

> info **info** The `useApitally` function automatically adds the correct middleware for your platform, whether you use Express or Fastify.

#### Consumers

You can associate requests with consumer identifiers using the `setConsumer` function, allowing you to get insights into API adoption and filter logs and metrics by consumer.

The most common place to set the consumer is in an authorization guard.

```typescript
import { Injectable, CanActivate } from '@nestjs/common';
import { setConsumer } from "apitally/nestjs";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const result = authenticateRequest(request); // assuming this sets request.user

    if (request.user) {
      setConsumer(request, {
        identifier: request.user.username,
        name: request.user.fullName, // optional
        group: request.user.role, // optional
      });
    }

    return result;
  }
}
```

#### Request logs

Capturing request and application logs is disabled by default. You can enable it by passing the `requestLogging` option to the `useApitally` function and configure in detail what's included in the logs.

```typescript
import { NestFactory } from "@nestjs/core";
import { useApitally } from "apitally/nestjs";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await useApitally(app, {
    clientId: "your-client-id",
    env: "dev", // or "prod" etc.
    requestLogging: {
      enabled: true,
      logRequestHeaders: true,
      logRequestBody: true,
      logResponseBody: true,
      captureLogs: true,  // application logs
    },
  });

  // ...
}

bootstrap();
```

With `captureLogs` set to `true`, the Apitally SDK automatically instruments built-in NestJS loggers and `console` to capture application logs, which are automatically correlated with the request logs.

> info **info** There are other options available to configure request logging, for example to mask sensitive fields or exclude certain requests. See official documentation linked below.

#### More information

For more information, please refer to the [official documentation](https://docs.apitally.io/frameworks/nestjs).

If you come across any issues with the Apitally SDK, please open a [GitHub issue](https://github.com/apitally/apitally-js/issues).
