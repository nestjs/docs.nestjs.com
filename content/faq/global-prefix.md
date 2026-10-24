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

> info **Hint** The `path` property supports wildcard parameters through the [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters) package. Bare wildcard asterisks (`*`) are deprecated; use parameters (`:param`) or named wildcards (`*splat`) instead. A named wildcard requires at least one extra segment, so `health/*splat` excludes `/health/status` but not `/health` itself. To exclude both, wrap the wildcard in braces: `health/{{ '{' }}*splat&#125;`.
