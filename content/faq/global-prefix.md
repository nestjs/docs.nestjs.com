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

#### Excluded routes and unmatched requests

Excluded routes are registered outside the prefix, but Nest still handles requests to them that don't match a handler. For example, with `exclude: ['health']` and only a `GET /health` handler, a `POST /health` request goes through your exception filters and gets Nest's standard `404` response.

With the Express adapter, a request to a path that is neither under the prefix nor excluded never reaches Nest: Express answers it with its default `404` page. The Fastify adapter passes every unmatched request to Nest.

> info **Hint** With [URI versioning](/http/versioning) enabled, exclusions are matched without the version segment, and an excluded route keeps it. For example, `exclude: ['health']` with `defaultVersion: '1'` serves the route at `/v1/health`.
