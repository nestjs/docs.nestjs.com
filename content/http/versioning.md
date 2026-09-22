### Versioning

> info **Hint** This chapter applies only to HTTP-based applications.

Versioning lets you run **different versions** of your controllers or individual routes within the same application. Applications change frequently, and you often need to introduce breaking changes while still supporting the previous version of the application.

Nest supports four types of versioning:

<table>
  <tr>
    <td><a href='http/versioning#uri-versioning-type'><code>URI Versioning</code></a></td>
    <td>The version is passed within the URI of the request (default)</td>
  </tr>
  <tr>
    <td><a href='http/versioning#header-versioning-type'><code>Header Versioning</code></a></td>
    <td>A custom request header specifies the version</td>
  </tr>
  <tr>
    <td><a href='http/versioning#media-type-versioning-type'><code>Media Type Versioning</code></a></td>
    <td>The <code>Accept</code> header of the request specifies the version</td>
  </tr>
  <tr>
    <td><a href='http/versioning#custom-versioning-type'><code>Custom Versioning</code></a></td>
    <td>Any aspect of the request may specify the version(s). You provide a custom function that extracts the version(s).</td>
  </tr>
</table>

#### URI Versioning Type

URI Versioning uses the version passed within the URI of the request, such as `https://example.com/v1/route` and `https://example.com/v2/route`.

> warning **Notice** With URI Versioning, the version is automatically added to the URI after the <a href="faq/global-prefix">global path prefix</a> (if one exists) and before any controller or route paths.

To enable URI Versioning for your application, do the following:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
// or "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(process.env.PORT ?? 3000);
```

> warning **Notice** By default, the version in the URI is automatically prefixed with `v`. To change the prefix, set the `prefix` key to your desired value, or set it to `false` to disable it.

> info **Hint** The `VersioningType` enum is available to use for the `type` property and is imported from the `@nestjs/common` package.

#### Header Versioning Type

Header Versioning uses a custom, user-specified request header whose value specifies the version to use for the request.

To enable **Header Versioning** for your application, do the following:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(process.env.PORT ?? 3000);
```

The `header` property is the name of the header that contains the version of the request.

> info **Hint** The `VersioningType` enum is available to use for the `type` property and is imported from the `@nestjs/common` package.

#### Media Type Versioning Type

Media Type Versioning uses the `Accept` header of the request to specify the version.

Within the `Accept` header, the version is separated from the media type with a semicolon (`;`), followed by a key-value pair that represents the version to use for the request, such as `Accept: application/json;v=2`. The key is treated as a prefix for the version, so the `key` property must include both the key and the separator.

To enable **Media Type Versioning** for your application, do the following:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(process.env.PORT ?? 3000);
```

The `key` property is the key and separator of the key-value pair that contains the version. For `Accept: application/json;v=2`, set the `key` property to `v=`.

> info **Hint** The `VersioningType` enum is available to use for the `type` property and is imported from the `@nestjs/common` package.

#### Custom Versioning Type

Custom Versioning uses any aspect of the request to specify the version (or versions). Nest analyzes the incoming request with an `extractor` function that returns a string or an array of strings.

If the requester provides multiple versions, the extractor function can return an array of strings sorted from the highest version to the lowest. Versions are matched to routes in order from highest to lowest.

If the `extractor` returns an empty string or array, no routes are matched and a 404 is returned.

For example, if an incoming request specifies that it supports versions `1`, `2`, and `3`, the `extractor` **must** return `['3', '2', '1']`. This ensures that the highest possible route version is selected first.

If versions `['3', '2', '1']` are extracted, but routes exist only for versions `2` and `1`, the route that matches version `2` is selected (version `3` is ignored).

> warning **Notice** With the Express adapter, make your `extractor` return a single version (a string, or an array with one element). Selecting the highest matching version from a multi-element array **does not reliably work** in Express due to design limitations of the adapter. If you need that behavior, use the Fastify adapter, which supports both single-version and highest-matching-version selection.

To enable **Custom Versioning** for your application, create an `extractor` function and pass it to `enableVersioning()`:

```typescript
@@filename(main)
// Example extractor that pulls out a list of versions from a custom header and turns it into a sorted array.
// This example uses Fastify, but Express requests can be processed in a similar way.
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(process.env.PORT ?? 3000);
```

#### Usage

Versioning lets you version controllers and individual routes, and also lets certain resources opt out of versioning. Usage is the same regardless of the versioning type your application uses.

> warning **Notice** If versioning is enabled for the application but a controller or route does not specify a version (and no [global default version](/http/versioning#global-default-version) is set), any request to that controller or route receives a `404` response status. Similarly, a request containing a version that has no corresponding controller or route also receives a `404` response status.

#### Controller versions

A version can be applied to a controller, setting the version for all routes within that controller.

To add a version to a controller, do the following:

```typescript
@@filename(cats.controller)
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1';
  }
}
@@switch
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1';
  }
}
```

#### Route versions

A version can be applied to an individual route. This version overrides any other version that would affect the route, such as the controller version.

To add a version to an individual route, do the following:

```typescript
@@filename(cats.controller)
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'This action returns all cats for version 2';
  }
}
@@switch
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1() {
    return 'This action returns all cats for version 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2() {
    return 'This action returns all cats for version 2';
  }
}
```

#### Multiple versions

Multiple versions can be applied to a controller or route. To use multiple versions, set the version to an array:

```typescript
@@filename(cats.controller)
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats for version 1 or 2';
  }
}
@@switch
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats for version 1 or 2';
  }
}
```

#### Version "Neutral"

Some controllers or routes behave the same regardless of the version. To accommodate this, set the version to the `VERSION_NEUTRAL` symbol.

An incoming request is mapped to a `VERSION_NEUTRAL` controller or route regardless of the version specified, including when the request contains no version at all.

> warning **Notice** With URI Versioning, a `VERSION_NEUTRAL` resource does not have the version in its URI.

To add a version-neutral controller or route, do the following:

```typescript
@@filename(cats.controller)
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'This action returns all cats regardless of version';
  }
}
@@switch
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'This action returns all cats regardless of version';
  }
}
```

#### Global default version

If you don't want to provide a version for each controller or individual route, or you want a specific version to act as the default for every controller or route that doesn't specify one, set the `defaultVersion` as follows:

```typescript
@@filename(main)
app.enableVersioning({
  // ...
  defaultVersion: '1',
  // or: defaultVersion: ['1', '2'],
  // or: defaultVersion: VERSION_NEUTRAL,
});
```

#### Middleware versioning

[Middleware](/middleware) can also use versioning metadata to target a specific route version. To do so, set the `version` property in the route object passed to the `MiddlewareConsumer.forRoutes()` method:

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware.js';
import { CatsModule } from './cats/cats.module.js';
import { CatsController } from './cats/cats.controller.js';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

With the code above, the `LoggerMiddleware` is applied only to version `'2'` of the `/cats` endpoint.

> info **Note** Middleware works with any versioning type described in this chapter: `URI`, `Header`, `Media Type`, or `Custom`.
