### Sentry

[Sentry](https://sentry.io) is an error tracking and performance monitoring platform that helps developers identify and fix issues in real-time. This recipe shows how to integrate Sentry with your NestJS application.

#### Installation

First, install the required dependencies:


```bash
$ npm install --save @sentry/nestjs @sentry/profiling-node
```
> info **Hint** we support `yarn` and `pnpm` as well. @sentry/profiling-node is optional, but recommended for performance profiling.


#### Basic Setup

To get started with Sentry, you'll need to create a file named `instrument.js` that should be imported before any other modules in your application:

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


Update your `main.ts` file to import `instrument.js` before other imports:


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

Afterward, add the `SentryModule` as a root module to your main module:


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

> info **Hint**  *Running with ESM*: If you run your application with ESM, you'll need to import the Sentry Initialization file before importing any other modules. Read about [running Sentry with ESM](https://docs.sentry.io/platforms/javascript/guides/nestjs/install/esm/). If you're not sure about how you're running your application, see [Installation Methods](https://docs.sentry.io/platforms/javascript/guides/nestjs/install/) for more information.


#### Add Readable Stack Traces to Errors

Depending on how you've set up your project, the stack traces in your Sentry errors probably won't look like your actual code.

To fix this, upload your source maps to Sentry. The easiest way to do this is by using the Sentry Wizard:

```bash
npx @sentry/wizard@latest -i sourcemaps
```


#### Testing the Integration

To verify your Sentry integration is working, you can add a test endpoint that throws an error:

```typescript
@Get("/debug-sentry")
getError() {
  throw new Error("My first Sentry error!");
}

```

Visit `/debug-sentry` in your application, and you should see the error appear in your Sentry dashboard.


### Summary

For complete documentation about Sentry's NestJS SDK, including advanced configuration options and features, visit the [official Sentry documentation](https://docs.sentry.io/platforms/javascript/guides/nestjs/).

While software bugs are Sentry's thing, we still write them. If you come across any problems while installing our SDK, please open a [GitHub Issue](https://github.com/getsentry/sentry-javascript/issues) or reach out on [Discord](https://discord.com/invite/sentry).
