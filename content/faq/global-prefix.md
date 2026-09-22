### Global prefix

To set a prefix for **every route** registered in an HTTP application, call the `setGlobalPrefix()` method on the `INestApplication` instance.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
```

To exclude routes from the global prefix, use the `exclude` option:

```typescript
app.setGlobalPrefix('v1', {
  exclude: [{ path: 'health', method: RequestMethod.GET }],
});
```

Alternatively, you can specify a route as a string, which excludes it for every request method:

```typescript
app.setGlobalPrefix('v1', { exclude: ['cats'] });
```

> info **Hint** The `path` property supports wildcard parameters through the [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) package. Bare wildcard asterisks (`*`) are not accepted; use parameters (`:param`) or named wildcards (`*splat`) instead.
