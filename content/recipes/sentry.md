### Sentry

[Sentry](https://sentry.io) is an error tracking and performance monitoring platform that helps developers identify and fix issues in real-time. This recipe shows how to integrate Sentry's [NestJS SDK](https://docs.sentry.io/platforms/javascript/guides/nestjs/) with your NestJS application.

#### Installation

First, install the required dependencies:

```bash
$ npm install --save @sentry/nestjs @sentry/profiling-node
```

> info **Hint** `@sentry/profiling-node` is optional, but recommended for performance profiling.

#### Basic setup

To get started with Sentry, you'll need to create a file named `instrument.ts` that should be imported before any other modules in your application:

```typescript
@@filename(instrument)
const Sentry = require("@sentry/nestjs");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
```

Update your `main.ts` file to import `instrument.ts` before other imports:

```typescript
@@filename(main)
// Import this first!
import "./instrument";

// Now import other modules
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

Afterwards, add the `SentryModule` as a root module to your main module:

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SentryModule.forRoot(),
    // ...other modules
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Exception handling

If you're using a global catch-all exception filter (which is either a filter registered with `app.useGlobalFilters()` or a filter registered in your app module providers annotated with a `@Catch()` decorator without arguments), add a `@SentryExceptionCaptured()` decorator to the filter's `catch()` method. This decorator will report all unexpected errors that are received by your global error filter to Sentry:

```typescript
import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception, host): void {
    // your implementation here
  }
}
```

By default, only unhandled exceptions that are not caught by an error filter are reported to Sentry. `HttpExceptions` (including [derivatives](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)) are also not captured by default because they mostly act as control flow vehicles.

If you don't have a global catch-all exception filter, add the `SentryGlobalFilter` to the providers of your main module. This filter will report any unhandled errors that aren't caught by other error filters to Sentry.

> warning **Warning** The `SentryGlobalFilter` needs to be registered before any other exception filters.

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // ..other providers
  ],
})
export class AppModule {}
```

#### Readable stack traces

Depending on how you've set up your project, the stack traces in your Sentry errors probably won't look like your actual code.

To fix this, upload your source maps to Sentry. The easiest way to do this is by using the Sentry Wizard:

```bash
npx @sentry/wizard@latest -i sourcemaps
```

#### Testing the integration

To verify your Sentry integration is working, you can add a test endpoint that throws an error:

```typescript
@Get("debug-sentry")
getError() {
  throw new Error("My first Sentry error!");
}
```

Visit `/debug-sentry` in your application, and you should see the error appear in your Sentry dashboard.

### Summary

For complete documentation about Sentry's NestJS SDK, including advanced configuration options and features, visit the [official Sentry documentation](https://docs.sentry.io/platforms/javascript/guides/nestjs/).

While software bugs are Sentry's thing, we still write them. If you come across any problems while installing our SDK, please open a [GitHub Issue](https://github.com/getsentry/sentry-javascript/issues) or reach out on [Discord](https://discord.com/invite/sentry).
