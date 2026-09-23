### HTTP client

Most applications call other services over HTTP. The `@nestjs/http-client` package provides a client for this, built on the `fetch` API that ships with Node.js. It adds what `fetch` leaves out: base URLs, default headers, JSON bodies, path and query parameters, typed responses, timeouts, retries, interceptors, and named clients. You configure it as a Nest module and inject it like any other provider.

The package has no dependencies besides `@nestjs/common` and `@nestjs/core`. Every method returns a Promise, so you `await` requests and handle failures with `try`/`catch`. If you prefer Observables, see [Working with RxJS](/application/http-client#working-with-rxjs).

> info **Hint** This package replaces the Axios-based `HttpModule` from `@nestjs/axios`, which this chapter used to describe. `@nestjs/axios` remains available. See [Migrating from @nestjs/axios](/application/http-client#migrating-from-nestjsaxios) to switch.

#### Installation

To get started, install the package:

```bash
$ npm i --save @nestjs/http-client
```

#### Getting started

Import `HttpClientModule` into the module that makes the requests, and register a client with the `register()` method:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { HttpClientModule } from '@nestjs/http-client';
import { CatsService } from './cats.service.js';

@Module({
  imports: [
    HttpClientModule.register({
      baseUrl: 'https://api.example.com/v1',
      timeout: '5s',
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

Then inject the `HttpClient` class:

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { HttpClient } from '@nestjs/http-client';
import type { Cat } from './interfaces/cat.interface.js';

@Injectable()
export class CatsService {
  constructor(private readonly http: HttpClient) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await this.http.get<Cat[]>('/cats');
    return data;
  }
}
```

The request goes to `https://api.example.com/v1/cats`. A relative URL is appended to `baseUrl` with exactly one `/` between them, so the `/v1` prefix is kept (unlike `new URL('/cats', base)`, which would drop it). A client without a `baseUrl` requires absolute URLs.

Like other `register()` methods, each call creates a client for the module that imports it. To make a client injectable in every module, set `isGlobal: true`.

#### Named clients

An application usually talks to several upstream services, each with its own base URL, credentials, and timeouts. Give each client a `name`:

```typescript
@@filename(repos.module)
@Module({
  imports: [
    HttpClientModule.register({
      name: 'github',
      baseUrl: 'https://api.github.com',
      headers: { accept: 'application/vnd.github+json' },
    }),
  ],
  providers: [ReposService],
})
export class ReposModule {}
```

and inject it with the `@InjectHttpClient()` decorator:

```typescript
@@filename(repos.service)
@Injectable()
export class ReposService {
  constructor(@InjectHttpClient('github') private readonly github: HttpClient) {}
}
```

A client registered without a name is the default client, injected as `HttpClient`. The `getHttpClientToken(name)` function returns the injection token of a client, which is useful in tests and custom providers.

#### Application-wide defaults

Settings that every client shares, such as a `user-agent` header, a timeout, a retry policy, or a logging interceptor, go into `HttpClientModule.forRoot()`. Import it once, in the root module. It is always global:

```typescript
@@filename(app.module)
@Module({
  imports: [
    HttpClientModule.forRoot({
      headers: { 'user-agent': 'cats-service/1.0' },
      timeout: '10s',
    }),
    CatsModule,
    ReposModule,
  ],
})
export class AppModule {}
```

`forRoot()` doesn't register a client itself, and it doesn't take a `baseUrl`. Each client's own settings win over its defaults, with three exceptions: headers are merged (set a header to `null` in a client to remove a default), retry settings are merged field by field, and the `forRoot()` interceptors run before the client's own.

#### Async configuration

To build a client's options from other providers, such as the `ConfigService` from the [configuration](/application/configuration#getting-started) chapter, use `registerAsync()`:

```typescript
@@filename(repos.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpClientModule, type Duration } from '@nestjs/http-client';
import { ReposService } from './repos.service.js';

@Module({
  imports: [
    HttpClientModule.registerAsync({
      name: 'github',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseUrl: config.getOrThrow<string>('GITHUB_API_URL'),
        headers: { authorization: `Bearer ${config.getOrThrow<string>('GITHUB_TOKEN')}` },
        timeout: config.get<Duration>('GITHUB_TIMEOUT', '5s'),
      }),
    }),
  ],
  providers: [ReposService],
})
export class ReposModule {}
```

The factory can be `async`. It returns the same options as `register()`, typed `HttpClientFactoryOptions`, except for `name`, `isGlobal`, `imports`, and interceptor classes: Nest needs those to build the module, before the factory runs, so they go next to `useFactory`. A factory that returns one of them stops the application at startup.

Instead of a factory, you can pass a class that implements the `HttpClientOptionsFactory` interface. Nest instantiates it inside the client's module and calls its `createHttpClientOptions()` method:

```typescript
@@filename(github-client.config)
@Injectable()
export class GithubClientConfig implements HttpClientOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createHttpClientOptions(): HttpClientFactoryOptions {
    return { baseUrl: this.config.getOrThrow<string>('GITHUB_API_URL') };
  }
}
```

```typescript
HttpClientModule.registerAsync({
  name: 'github',
  imports: [ConfigModule],
  useClass: GithubClientConfig,
});
```

To reuse a provider that already exists instead of creating a private copy, pass `useExisting: GithubClientConfig`, with the module that exports it in `imports`. `forRootAsync()` works the same way. Its `useClass` or `useExisting` class implements `HttpClientModuleOptionsFactory`, with a `createHttpClientModuleOptions()` method.

#### Making requests

A client has a method for each HTTP verb: `get()`, `post()`, `put()`, `patch()`, `delete()`, `head()`, and `options()`. Each one takes a URL and an optional options object, and resolves to an `HttpResponse`. The `request()` method takes the verb as the `method` option.

```typescript
@@filename(repos.service)
@Injectable()
export class ReposService {
  constructor(@InjectHttpClient('github') private readonly github: HttpClient) {}

  async findAll(org: string): Promise<Repo[]> {
    const { data } = await this.github.get<Repo[]>('/orgs/:org/repos', {
      params: { org },
      query: { type: 'public', sort: 'updated', topic: ['nest', 'typescript'] },
    });
    return data;
  }

  async createIssue(owner: string, repo: string, issue: CreateIssueDto): Promise<Issue> {
    const { data } = await this.github.post<Issue>('/repos/:owner/:repo/issues', {
      params: { owner, repo },
      json: issue,
    });
    return data;
  }
}
```

The options mirror what a Nest controller reads from a request:

- `params` fills the `:name` segments of the path, URI-encoded. A segment without a value throws, even when `params` is omitted, and so does a key that matches no segment, or a value that would move the request to another endpoint (an empty string, `.`, or `..`).
- `query` is an object or a `URLSearchParams` instance, appended to any query already in the URL. Arrays repeat the key (`topic=nest&topic=typescript`), `Date` values become ISO strings, and `null` and `undefined` values are skipped. The first request above goes to `https://api.github.com/orgs/nestjs/repos?type=public&sort=updated&topic=nest&topic=typescript`.
- `json` is serialized with `JSON.stringify()`, and sets the `content-type: application/json` header unless you set one.
- `body` is passed to `fetch` as is: a string, `Buffer`, `FormData`, `URLSearchParams`, `Blob`, a web or Node.js stream, or an async iterable. Pass either `json` or `body`, not both. A `GET` or `HEAD` request with a body throws before anything is sent.
- `headers` is merged over the client's headers. A `null` value removes a header.
- `timeout`, `retry`, `signal`, `throwOnHttpError`, `redirect`, and `dispatcher` override the client's settings for one request, and are covered below.
- `context` is a free-form object that [interceptors](/application/http-client#interceptors) can read.

The type argument, such as `Repo[]`, describes `data`. Nothing checks it at runtime, so validate responses from APIs you don't control. The `responseType` option controls how the body is read:

| `responseType` | `data` |
| --- | --- |
| `'auto'` (default) | Parsed JSON when the `content-type` is JSON (including `+json` types), otherwise a string. `undefined` when the body is empty, for `204`, `205`, and `304` responses, and for `HEAD` requests. |
| `'json'` | Parsed JSON, whatever the content type. |
| `'text'` | A string. |
| `'arrayBuffer'` | An `ArrayBuffer`. |
| `'stream'` | A Node.js `Readable`. See [Streaming responses](/application/http-client#streaming-responses). |
| `'response'` | The web `Response`, with its body unread. |

The type of `data` follows `responseType`, so `responseType: 'text'` resolves to `HttpResponse<string>`. A successful response whose body isn't valid JSON, although it was expected to be, rejects with an `HttpParseError`. The response object has the following shape:

```typescript
interface HttpResponse<T> {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Headers; // a web Headers object: headers.get('etag')
  data: T;
  url: string; // the final URL, after redirects
  request: HttpRequest; // the request that was sent, after interceptors ran
}
```

#### Timeouts and cancellation

`fetch` has no timeout of its own, apart from the 5-minute limits of undici, the HTTP client inside Node.js. Set a `timeout` on each client, either in milliseconds or as a duration string such as `'500ms'`, `'5s'`, or `'2m'`. An invalid value fails at startup, with an error that names the option. `0` means no timeout, which is the default.

The timeout applies to **each attempt**, not to the whole call. It covers the attempt's interceptors and reading the response body. For `responseType: 'stream'` and `'response'`, it stops once the headers arrive, so a long download isn't cut off. When it elapses, the attempt fails with an `HttpTimeoutError`, and the request is retried like after any other [transient failure](/application/http-client#retries).

To cancel a request, pass an `AbortSignal` as the `signal` option. It is combined with the timeout. A cancelled request rejects with the signal's `reason`, as `fetch` does, and is never retried, even while it waits between two attempts.

Because of retries, a call can take up to `attempts × timeout`, plus the waits between attempts. To put a limit on the whole call, pass a deadline as the signal:

```typescript
const { data } = await this.github.get<Repo>('/repos/:owner/:repo', {
  params: { owner, repo },
  signal: AbortSignal.timeout(10_000),
});
```

The deadline rejects with a `DOMException` named `TimeoutError`, which `toHttpException()` maps to `504 Gateway Timeout`, like an `HttpTimeoutError`. To combine it with another signal, use `AbortSignal.any([signal, AbortSignal.timeout(10_000)])`.

#### Retries

Retries are **on by default**. Without any configuration, a client makes up to 3 attempts for `GET`, `HEAD`, `OPTIONS`, `PUT`, and `DELETE`, the methods that HTTP defines as idempotent. It retries after:

- connection errors, such as a refused or reset connection (including a reset while the body is read),
- per-attempt timeouts,
- `408`, `429`, `500`, `502`, `503`, and `504` responses.

Between attempts, the client waits with exponential backoff and full jitter: a random delay of up to 200 ms after the first attempt, up to 400 ms after the second, and so on, capped at 30 seconds. A `Retry-After` response header, in seconds or as an HTTP date, replaces the backoff. When it asks for more than the cap, the client doesn't wait at all, and returns (or throws) the `429` or `503` response right away. A request whose body is a stream is never retried, because the first attempt consumed it.

The `retry` option takes a number of attempts, `false` for a single attempt, or an object:

```typescript
HttpClientModule.register({
  name: 'github',
  baseUrl: 'https://api.github.com',
  retry: {
    attempts: 4, // in total, including the first request
    backoff: { delay: '500ms', factor: 2, maxDelay: '5s', jitter: 'full' },
    retryIf: (error, attempt) => !(error instanceof HttpNetworkError),
    methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
}),
```

Every field you omit keeps its default. `backoff` can also be a function that receives the number of the attempt that failed and its error, and returns a duration. `jitter` can be `'full'`, `'equal'` (at least half of the computed delay), or `'none'`. `retryIf` is only asked about failures the client would retry anyway, so it can narrow the defaults but not widen them; use `methods` and `statusCodes` for that. It receives the `HttpResponseError` (with its `body`), `HttpTimeoutError`, or `HttpNetworkError` of the attempt that failed.

Retry settings are layered: `forRoot()`, then the client, then the request. Each layer overrides only the fields it sets, and a later layer can turn retries back on after an earlier `false`. `methods` and `statusCodes`, however, **replace** the default lists instead of adding to them.

`POST` and `PATCH` aren't retried, because repeating them could, for example, charge a customer twice. When the upstream API supports idempotency keys, send one and opt in for that request:

```typescript
const { data } = await this.payments.post<Charge>('/charges', {
  json: charge,
  headers: { 'idempotency-key': `charge-${order.id}` },
  retry: { methods: ['POST'] },
});
```

The key identifies the operation, so every attempt sends the same one, and the upstream returns the original result instead of creating a second charge. Setting `methods: ['POST']` on the client instead would also stop `GET` retries, since the list replaces the default one.

> warning **Warning** Retries multiply along a chain of services. If service A calls B, B calls C, and every hop makes 3 attempts, one failing request to C turns into 9 calls to C, which arrive exactly when C is already struggling. Retry at one layer only, usually the service that calls the external dependency, and set `retry: false` on clients that call your own services.

#### Handling errors

A request rejects with one of the following errors, all of which extend the `HttpClientError` class:

| Error | When | Fields |
| --- | --- | --- |
| `HttpResponseError` | The upstream answered with a non-2xx status. | `status`, `statusText`, `headers`, `body` (parsed JSON, otherwise text), `method`, `url` |
| `HttpTimeoutError` | The `timeout` elapsed on the last attempt. | `timeoutMs`, `method`, `url` |
| `HttpNetworkError` | The connection failed: DNS, a refused or reset connection, TLS, or a redirect that `redirect: 'error'` refused. | `cause` (for example, with `cause.code` set to `ECONNREFUSED`), `method`, `url` |
| `HttpParseError` | A successful response isn't valid JSON, although it was expected to be. | `status`, `statusText`, `headers`, `body` (the raw text), `method`, `url` |

A cancelled request rejects with the signal's reason, and errors thrown by interceptors propagate unchanged. A request the client refuses to send, such as one with an invalid `params` value, rejects with a `TypeError`. To receive non-2xx responses as values instead, set `throwOnHttpError: false` on the client or on a request, and check `ok` or `status` yourself.

If one of these errors escapes a route handler, Nest answers `500 Internal Server Error`. For your API's callers, though, a failing upstream is usually a `502 Bad Gateway`, and one that doesn't answer in time is a `504 Gateway Timeout`. The `toHttpException()` function maps the errors accordingly:

| Error | Becomes |
| --- | --- |
| `HttpResponseError` | `502 Bad Gateway`, or the upstream status and body when the status is listed in `forward` |
| `HttpTimeoutError`, or the `TimeoutError` of an `AbortSignal.timeout()` deadline | `504 Gateway Timeout` |
| `HttpNetworkError`, `HttpParseError` | `502 Bad Gateway` |
| Anything else, including an `HttpException` | Returned unchanged, so Nest handles it as usual |

```typescript
@@filename(repos.service)
async findOne(owner: string, repo: string): Promise<Repo> {
  try {
    const { data } = await this.github.get<Repo>('/repos/:owner/:repo', {
      params: { owner, repo },
    });
    return data;
  } catch (error) {
    if (error instanceof HttpResponseError && error.status === 404) {
      throw new NotFoundException(`Repository ${owner}/${repo} not found`);
    }
    throw toHttpException(error);
  }
}
```

By default, the upstream body isn't passed on to the caller, since it may describe the upstream's internals. To pass selected statuses through with their body, such as a `422` whose body tells the caller what to fix, use `toHttpException(error, options)` with `forward` set to `[422]`, or to `true` for every status. The original error is kept as the exception's `cause`.

Nest's built-in exception filter [doesn't log](/exception-filters#exceptions-logging) an `HttpException`, so a `502` or `504` would leave no trace. `toHttpException()` therefore logs every failure that it turns into a `5xx`, with the `HttpClient` context:

```text
ERROR [HttpClient] GET https://api.github.com/repos/nestjs/nest failed with 503 Service Unavailable; answering 502 Bad Gateway
```

Set the `log` option to `false` when something else, such as your own exception filter, already logs upstream failures.

Instead of mapping errors in every service, you can let them leave the handler unchanged and map them in an [exception filter](/exception-filters#binding-filters). This keeps call sites free of `try`/`catch`, and interceptors further out still see the original error:

```typescript
@@filename(http-client-error.filter)
import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { HttpClientError, toHttpException } from '@nestjs/http-client';

@Catch(HttpClientError)
export class HttpClientErrorFilter extends BaseExceptionFilter {
  catch(error: HttpClientError, host: ArgumentsHost) {
    super.catch(toHttpException(error), host);
  }
}
```

An `AbortSignal.timeout()` deadline isn't an `HttpClientError`, so add `DOMException` to `@Catch()` if you use deadlines. `toHttpException()` returns an `HttpException`, so in a microservice or WebSocket handler, convert the errors to an `RpcException` or `WsException` yourself.

> info **Hint** Error messages and objects end up in logs, so the client keeps secrets out of them. A message never includes the response body, and the URL in it has its query values masked, as in `GET https://api.example.com/users?email=***`. The `url`, `headers`, and `body` fields are non-enumerable: your code can read them, but loggers and `JSON.stringify()` leave them out.

#### Interceptors

An interceptor wraps every request a client sends. It receives the request and a `next` function that sends it, and returns the resulting web `Response`. The simplest form is a function:

```typescript
@@filename(api-key.interceptor)
import type { HttpClientInterceptorFn } from '@nestjs/http-client';

export function apiKeyInterceptor(apiKey: string): HttpClientInterceptorFn {
  return (request, next) => {
    request.headers.set('x-api-key', apiKey);
    return next(request);
  };
}
```

The `HttpRequest` object holds the `method`, the `url` (a `URL` instance), the `headers` (a `Headers` instance), the `body`, the `signal`, the `attempt` number, and the request's `context`. You can change it in place, or pass a modified copy to `next()`. Interceptors see the response **before** the status check, so a `4xx` or `5xx` response reaches them too. An interceptor must return what `next()` resolves to, or a `Response` of its own.

When an interceptor needs other providers, write it as a class that implements the `HttpClientInterceptor` interface:

```typescript
@@filename(github-auth.interceptor)
import { Injectable } from '@nestjs/common';
import type { HttpClientInterceptor, HttpHandler, HttpRequest } from '@nestjs/http-client';
import { GithubTokenService } from './github-token.service.js';

@Injectable()
export class GithubAuthInterceptor implements HttpClientInterceptor {
  constructor(private readonly tokens: GithubTokenService) {}

  async intercept(request: HttpRequest, next: HttpHandler): Promise<Response> {
    request.headers.set('authorization', `Bearer ${await this.tokens.getToken()}`);
    return next(request);
  }
}
```

Pass interceptors in the `interceptors` array of `register()` or `forRoot()`, or next to `useFactory` in the async variants:

```typescript
@@filename(repos.module)
@Module({
  imports: [
    HttpClientModule.register({
      name: 'github',
      baseUrl: 'https://api.github.com',
      interceptors: [GithubAuthInterceptor],
    }),
  ],
  providers: [GithubTokenService, GithubAuthInterceptor, ReposService],
})
export class ReposModule {}
```

Nest resolves interceptor classes when the application initializes, so an interceptor may even depend on a service that injects the same client. If the class is a provider anywhere in the application, as `GithubAuthInterceptor` is above, that instance is used. Otherwise, Nest creates it inside the client's own module, which sees global providers and the modules you pass in the `imports` option of `register()`. An async factory may also return interceptors in its options, but only functions and instances, such as `apiKeyInterceptor(config.getOrThrow('API_KEY'))`.

Interceptors run in the order they are listed, the first one outermost, and the `forRoot()` interceptors run before the client's own. They run **once per attempt**, so a retry gets a fresh token, and `request.attempt` tells them which attempt it is. When an attempt fails, `next()` rejects with an `HttpNetworkError` or `HttpTimeoutError`, or with the abort reason. This makes an interceptor a good place to log upstream traffic:

```typescript
@@filename(http-logging.interceptor)
import { Injectable, Logger } from '@nestjs/common';
import type { HttpClientInterceptor, HttpHandler, HttpRequest } from '@nestjs/http-client';

@Injectable()
export class HttpLoggingInterceptor implements HttpClientInterceptor {
  private readonly logger = new Logger('HttpClient');

  async intercept(request: HttpRequest, next: HttpHandler): Promise<Response> {
    const target = `${request.method} ${request.url.origin}${request.url.pathname}`;
    const start = performance.now();
    try {
      const response = await next(request);
      const ms = Math.round(performance.now() - start);
      this.logger.log(`${target} ${response.status} ${ms}ms (attempt ${request.attempt})`);
      return response;
    } catch (error) {
      this.logger.warn(`${target} failed: ${(error as Error).name} (attempt ${request.attempt})`);
      throw error;
    }
  }
}
```

Registered with `HttpClientModule.forRoot()` and `interceptors: [HttpLoggingInterceptor]`, it logs the requests of every client. It logs the path without the query string, which often carries personal data or keys.

> info **Hint** For tracing, you don't need an interceptor. [NestJS Observe](/observability/distributed-tracing#http-to-http) records every outbound `fetch` call as a span, and propagates the trace id to other Nest services.

#### Streaming responses

To pass a large response through without buffering it in memory, set `responseType: 'stream'`. The `data` is a Node.js `Readable`, which you can return from a route handler in a [`StreamableFile`](/http/file-upload#streaming-files):

```typescript
@@filename(invoices.controller)
@Get(':id/pdf')
async download(@Param('id') id: string): Promise<StreamableFile> {
  const { data, headers } = await this.billing.get('/invoices/:id/pdf', {
    params: { id },
    responseType: 'stream',
  });
  return new StreamableFile(data, {
    type: headers.get('content-type') ?? 'application/pdf',
  });
}
```

The timeout stops once the headers arrive, while cancelling the `signal` still stops the download. A non-2xx response is read and thrown as an `HttpResponseError`, as usual. Don't pass the upstream's `content-length` header on as the `length` option: `fetch` decompresses gzip and brotli bodies, so the stream can be longer than the header says. For the web `ReadableStream`, use `responseType: 'response'` and read `data.body`.

#### Proxies, TLS, and redirects

Node.js's `fetch` runs on undici, whose default dispatcher keeps a pool of keep-alive connections, so the common case needs no configuration. To change the pool size, route through a proxy, or use custom TLS settings (a private CA, or client certificates), pass an undici dispatcher as the `dispatcher` option:

```typescript
@@filename(partner.module)
import { readFileSync } from 'node:fs';
import { Agent } from 'undici';

@Module({
  imports: [
    HttpClientModule.register({
      name: 'partner',
      baseUrl: 'https://partner.example.com',
      dispatcher: new Agent({
        connections: 20,
        connect: {
          ca: readFileSync('certs/partner-ca.pem'),
          cert: readFileSync('certs/client.pem'),
          key: readFileSync('certs/client-key.pem'),
        },
      }),
    }),
  ],
})
export class PartnerModule {}
```

For a proxy, pass `new ProxyAgent('http://proxy.internal:3128')`. Node.js doesn't expose these classes from a built-in module, so install the `undici` package yourself (`@nestjs/http-client` doesn't depend on it), preferably with the major version that your Node.js release bundles. A Node.js `http.Agent`, which Axios accepts as `httpsAgent`, doesn't work with `fetch`, and fails to compile. To route every client through the proxy from the `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` environment variables instead, start Node.js with `--use-env-proxy` (or set `NODE_USE_ENV_PROXY=1`) on a release that supports it.

The `redirect` option controls how `fetch` handles `3xx` responses: `'follow'` (the default), `'error'`, which fails with an `HttpNetworkError`, or `'manual'`, which returns them. A `3xx` response isn't a success, so combine `'manual'` with `throwOnHttpError: false` to read its `location` header. When `fetch` follows a redirect to another origin, it drops the `authorization` and `cookie` headers, but not others. A client that authenticates with a custom header, such as `x-api-key`, should use `redirect: 'error'` unless the API relies on redirects.

#### Security

The client guards against a few common mistakes:

- **A client with a `baseUrl` only sends requests to its origin.** An absolute URL on the same origin, such as a pagination link, works, but one on another host throws before anything is sent. The client's headers and interceptors carry that upstream's credentials, and a URL taken from user input or from an upstream response must not receive them. Use a client without a `baseUrl` to call arbitrary hosts.
- **Path parameters are encoded.** Put request values in `params` and `query` instead of building the path with string interpolation. They are URI-encoded, and a `params` value such as `..` throws instead of moving the request to another endpoint.
- **Credentials in URLs are refused.** A `baseUrl` or request URL such as `https://user:pass@example.com` throws. Send credentials in the `authorization` header instead. A header value with a line break throws, without quoting the value in the message.
- **Errors are safe to log**, as described in [Handling errors](/application/http-client#handling-errors).

#### Testing

A stub `fetch` is the easiest way to test code that calls an external API. Pass it to `HttpClientModule.forRoot()`, and every client uses it, while keeping its base URL, headers, retry policy, and interceptors. The stub only has to return a standard `Response`:

```typescript
@@filename(repos.service.spec)
import { Test } from '@nestjs/testing';
import { HttpClientModule } from '@nestjs/http-client';
import { vi } from 'vitest';
import { ReposModule } from './repos.module.js';
import { ReposService } from './repos.service.js';

describe('ReposService', () => {
  const fetch = vi.fn<typeof globalThis.fetch>();
  let repos: ReposService;

  beforeEach(async () => {
    fetch.mockReset();
    const moduleRef = await Test.createTestingModule({
      imports: [HttpClientModule.forRoot({ fetch }), ReposModule],
    }).compile();
    await moduleRef.init();
    repos = moduleRef.get(ReposService);
  });

  it('lists the public repositories of an organization', async () => {
    fetch.mockResolvedValueOnce(Response.json([{ name: 'nest' }]));

    await expect(repos.findAll('nestjs')).resolves.toEqual([{ name: 'nest' }]);
    const [url] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      'https://api.github.com/orgs/nestjs/repos?type=public&sort=updated&topic=nest&topic=typescript',
    );
  });

  it('retries a 503', async () => {
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json([]));

    await expect(repos.findAll('nestjs')).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
```

Give every call its own `Response`, as `mockResolvedValueOnce()` does above: a response body can be read only once, so `mockResolvedValue()` would hand an already-read response to a retry. A client that sets its own `fetch` option keeps it, since a client's settings win over the `forRoot()` defaults. A client without one calls `globalThis.fetch` on every request, so `vi.stubGlobal('fetch', stub)` works too.

For an end-to-end test of an application that already calls `forRoot()`, override its options instead. This replaces every `forRoot()` option, except the interceptors passed directly to `forRoot()` or next to `useFactory`, which keep running:

```typescript
const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(HTTP_CLIENT_MODULE_OPTIONS)
  .useValue({ fetch })
  .compile();
```

To keep HTTP out of a test entirely, replace the client itself with `overrideProvider(getHttpClientToken('github'))`. Outside of Nest, for example in a script, create a client with `new HttpClient(options)`.

#### Working with RxJS

To compose a request with RxJS operators, wrap it in an Observable. `defer()` starts the request when the Observable is subscribed to, while `from()` starts it immediately:

```typescript
import { defer } from 'rxjs';

const cats$ = defer(() => this.http.get<Cat[]>('/cats'));
```

Neither one cancels the request on unsubscribe. When you need that, for example with `switchMap()`, connect unsubscription to an `AbortController`:

```typescript
import { Observable } from 'rxjs';

function fromRequest<T>(send: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const controller = new AbortController();
    send(controller.signal).then(
      (value) => {
        subscriber.next(value);
        subscriber.complete();
      },
      (error) => subscriber.error(error),
    );
    return () => controller.abort();
  });
}

const cats$ = fromRequest((signal) => this.http.get<Cat[]>('/cats', { signal }));
```

#### Migrating from `@nestjs/axios`

The `@nestjs/axios` package remains available, and both packages can be installed side by side while you migrate. The following table maps its features to `@nestjs/http-client`:

| `@nestjs/axios` | `@nestjs/http-client` |
| --- | --- |
| `HttpModule.register()` with `baseURL` | `HttpClientModule.register()` with `baseUrl` |
| `HttpModule.registerAsync()` | `HttpClientModule.registerAsync()`, which also takes a `name` |
| `HttpModuleOptionsFactory` with `createHttpOptions()` | `HttpClientOptionsFactory` with `createHttpClientOptions()` |
| `extraProviders` in `registerAsync()` | A module that exports the providers, passed in `imports` |
| One `HttpService` per importing module | Named clients, injected with `@InjectHttpClient(name)` |
| `HttpService` methods, which return Observables | `HttpClient` methods, which return Promises |
| `firstValueFrom(this.httpService.get(url))` | `await this.http.get(url)` |
| `post(url, data)` | `post(url, options)`, with the data in `json` (or `body`) |
| `params` in the request config | `query`. Arrays repeat the key, where Axios writes `key[]=`. In `@nestjs/http-client`, `params` fills `:name` path segments, and throws for a key that matches none. |
| `response.headers['etag']` | `response.headers.get('etag')` |
| `AxiosError` with `error.response?.status` | `HttpResponseError` with `error.status` and `error.body` |
| `error.code === 'ECONNABORTED'` | `HttpTimeoutError` |
| `validateStatus: () => true` | `throwOnHttpError: false` |
| `axiosRef` (the Axios instance) | No underlying instance. Use the client's options, or pass a custom function as `fetch`. |
| `axiosRef.interceptors.request.use()` and `response.use()` | `interceptors`, with one function for both the request and the response |
| `httpsAgent` or `proxy` | `dispatcher`, an undici `Agent` or `ProxyAgent` |
| `maxRedirects: 0` | `redirect: 'manual'` |
| No retries, unless you add `axios-retry` | Retries on by default for idempotent methods. `retry: false` restores the Axios behavior. |
| `timeout` for the whole request | `timeout` per attempt, also as a string such as `'5s'` |
| `onUploadProgress`, `onDownloadProgress` | No equivalent. Count the bytes of a stream instead. |
