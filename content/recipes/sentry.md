### Sentry

[Sentry](https://sentry.io) is an error monitoring and performance tracking platform that helps developers identify and fix issues in real-time. This recipe shows how to integrate Sentry with your NestJS application for error monitoring and distributed tracing.

#### Installation

First, install the required dependencies:


```bash
$ npm install --save @sentry/nestjs @sentry/profiling-node
```


#### Basic Setup

To get started with Sentry, you'll need to create an initialization file (e.g., `sentry.init.ts`) that should be imported before any other modules in your application:

```typescript
import as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
Sentry.init({
dsn: 'your-sentry-dsn',
integrations: [
nodeProfilingIntegration(),
],
// Set sampling rate for tracing (adjust in production)
tracesSampleRate: 1.0,
// Set sampling rate for profiling
profilesSampleRate: 1.0,
});

```


Update your `main.ts` file to import the Sentry initialization before other imports:


```typescript
// Import Sentry initialization first
import './sentry.init';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
const app = await NestFactory.create(AppModule);
await app.listen(3000);
}
bootstrap();
```


#### Module Integration

Add the SentryModule to your application's root module:


```typescript
import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
@Module({
imports: [
SentryModule.forRoot(),
// other modules...
],
controllers: [AppController],
providers: [AppService],
})
export class AppModule {}
```


#### Exception Handling

To ensure Sentry captures unhandled exceptions, you can add the SentryGlobalFilter to your application module:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
@Module({
providers: [
{
provide: APP_FILTER,
useClass: SentryGlobalFilter,
},
// other providers...
],
})
export class AppModule {}
```


For custom exception filters, you can use the `@SentryExceptionCaptured()` decorator:

```typescript
import { Catch, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
@SentryExceptionCaptured()
catch(exception: unknown, host: ArgumentsHost) {
// Your exception handling logic
}
}
```


#### Testing the Integration

To verify your Sentry integration is working, you can add a test endpoint that throws an error:

```typescript
import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
@Get('debug-sentry')
testSentry() {
throw new Error('Test Sentry Integration!');
}
}
```


Visit `/debug-sentry` in your application, and you should see the error appear in your Sentry dashboard.

> info **Hint** For complete documentation about Sentry's NestJS integration, including advanced configuration options and features, visit the [official Sentry documentation](https://docs.sentry.io/platforms/javascript/guides/nestjs/).

