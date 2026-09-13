### Global prefix

To set a prefix for **every route** registered in an HTTP application, call the `setGlobalPrefix()` method on the `INestApplication` instance.

```typescript
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('v1');
```

To serve the same routes under more than one prefix, pass an array. Every route is then registered once per prefix:

```typescript
app.setGlobalPrefix(['api', 'v1']);
// GET /api/cats and GET /v1/cats reach the same route handler
```

> info **Hint** In Nest v10 and earlier, a regular expression prefix such as `(api|v1)` served this purpose. That syntax is no longer supported, so use an array instead.

> warning **Warning** `@nestjs/swagger` only reads the first prefix. With `app.setGlobalPrefix(['api', 'v1'])`, the generated OpenAPI document lists routes under `/api` only, and the [`useGlobalPrefix`](/openapi/introduction#setup-options) option serves Swagger UI under `/api` only.

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

The `exclude` option behaves the same way with multiple prefixes: excluded routes are served without any prefix. In the following example, `health` is only available at `/health`, while every other route is available under both `/api` and `/v1`:

```typescript
app.setGlobalPrefix(['api', 'v1'], { exclude: ['health'] });
```
