### Application context

There are several ways of mounting the Nest application. You can create either a web app, microservice or just a Nest **application context**. Nest context is a wrapper around the Nest container, which holds all instantiated classes. We can grab an existing instance from within any imported module directly using application object. Hence, you can take advantage of the Nest framework everywhere, including **CRON** jobs and even build a **CLI** on top of it.

#### Getting started

In order to create a Nest application context, we use the following syntax:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ApplicationModule);
  // application logic...
}
bootstrap();
```

Afterward, Nest allows you to pick any instance registered within Nest application. Let's imagine that we have a `TasksService` in the `TasksModule`. This class provides a set of usable methods, which we want to call from within CRON job.

```typescript
@@filename()
const app = await NestFactory.create(ApplicationModule);
const tasksService = app.get(TasksService);
```

And that's it. To grab `TasksService` instance we had to use `get()` method. We didn't have to go through entire modules tree, the `get()` method act like a **query** that search for an instance in each registered module automatically. However, if you prefer a strict context checking, you can always switch to it using `strict: true` options object that has to be passed as the second argument of `get()` method. Then, you have to go through all modules to pick up a particular instance from the selected context.

```typescript
@@filename()
const app = await NestFactory.create(ApplicationModule);
const tasksService = app.select(TasksModule).get(TasksService, { strict: true });
```

<table>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Retrieves an instance of either controller or provider (including guards, filters, and so on) available in the application
      context.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Navigates through the modules graph, for example, to pull out a specific instance from the selected module (used together with
      enabled strict mode).
    </td>
  </tr>
</table>

> info **Hint** In non-strict mode, the root module is selected by default. In order to select any other module, you need to go through entire modules tree (step by step).

If you want the node application to close after the script finishes (useful for CRON jobs), add `await app.close()` to the end of your `bootstrap` function:

```typescript
@@filename()
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ApplicationModule);
  // application logic...
  await app.close();
}
bootstrap();
```
