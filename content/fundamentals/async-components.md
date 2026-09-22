### Asynchronous providers

Sometimes the application start should be delayed until one or more **asynchronous tasks** complete. For example, you may not want to start accepting requests until the connection to the database has been established. Asynchronous providers let you do this.

To create one, use `async/await` with the `useFactory` syntax. The factory returns a `Promise`, and the factory function can `await` asynchronous tasks. Nest awaits resolution of the promise before instantiating any class that depends on (injects) such a provider.

```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
```

> info **Hint** Learn more about the custom provider syntax in the [custom providers](/fundamentals/custom-providers) chapter.

#### Injection

Asynchronous providers are injected into other components by their tokens, like any other provider. In the example above, you would use `@Inject('ASYNC_CONNECTION')`.
