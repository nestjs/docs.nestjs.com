### Standalone applications

There are several ways to mount a Nest application. You can create a web app, a microservice, or a bare Nest **standalone application** (without any network listeners). A standalone application is a wrapper around the Nest **IoC container**, which holds all instantiated classes. Through the standalone application object, you can obtain a reference to any existing instance from any imported module. This lets you take advantage of the Nest framework anywhere, including scripted **CRON** jobs. You can even build a **CLI** on top of it.

#### Getting started

To create a Nest standalone application, use the following construction:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // your application logic here ...
}
await bootstrap();
```

#### Retrieving providers from static modules

The standalone application object lets you obtain a reference to any instance registered within the Nest application. Imagine that a `TasksService` provider lives in a `TasksModule`, which is imported by `AppModule`. The class provides a set of methods that you want to call from within a CRON job.

```typescript
@@filename()
const tasksService = app.get(TasksService);
```

To access the `TasksService` instance, use the `get()` method. It acts like a **query** that searches for an instance in each registered module, and accepts any provider's token. For strict context checking, pass an options object with the `strict: true` property. With this option in effect, you have to navigate to a specific module to obtain an instance from that selected context.

```typescript
@@filename()
const tasksService = app.select(TasksModule).get(TasksService, { strict: true });
```

The following table summarizes the methods available for retrieving instance references from the standalone application object.

<table>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Retrieves an instance of a controller or provider (including guards, filters, and so on) available in the application context.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigates through the module graph to pull out a specific instance of the selected module (used together with strict mode, as described above).
    </td>
  </tr>
</table>

> info **Hint** In non-strict mode, the root module is selected by default. To select any other module, navigate the module graph manually, step by step.

A standalone application does not have any network listeners, so Nest features tied to request handling (e.g., middleware, interceptors, pipes, and guards) are not available in this context.

For example, even if you register a global interceptor in your application and then retrieve a controller instance with the `app.get()` method, the interceptor is not executed when you call the controller's methods.

#### Retrieving providers from dynamic modules

When working with [dynamic modules](/fundamentals/dynamic-modules), pass `app.select()` the same object that represents the registered dynamic module in the application. For example:

```typescript
@@filename()
export const dynamicConfigModule = ConfigModule.register({ folder: './config' });

@Module({
  imports: [dynamicConfigModule],
})
export class AppModule {}
```

You can then select that module later on:

```typescript
@@filename()
const configService = app.select(dynamicConfigModule).get(ConfigService, { strict: true });
```

#### Terminating phase

If you want the Node.js process to exit after the script finishes (e.g., for a script running CRON jobs), call the `app.close()` method at the end of your `bootstrap()` function:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // application logic...
  await app.close();
}
await bootstrap();
```

As described in the [lifecycle events](/fundamentals/lifecycle-events) chapter, calling `app.close()` triggers the shutdown lifecycle hooks.

#### Example

A working example is available in the [standalone application sample](https://github.com/nestjs/nest/tree/master/sample/18-context) on GitHub.
