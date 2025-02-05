### Global prefix

To set a prefix for **every route** registered in an HTTP application, use the `setGlobalPrefix()` method of the `INestApplication` instance.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
```

You can exclude routes from the global prefix using the following construction:

```typescript
app.setGlobalPrefix('v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});
```

Alternatively, you can specify route as a string (it will apply to every request method):

```typescript
app.setGlobalPrefix('v1', { exclude: ['cats'] });
```

> info **Hint** The `path` property supports wildcard parameters using the [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) package. Note: this does not accept wildcard asterisks `*`. Instead, you must use parameters (`:param`) or named wildcards (`*splat`).
