### HTTP module

[Axios](https://github.com/axios/axios) is a widely used, feature-rich HTTP client package. Nest wraps Axios and exposes it through the `HttpModule` from the `@nestjs/axios` package. The `HttpModule` exports the `HttpService` class, which exposes Axios-based methods for performing HTTP requests. `HttpService` also wraps the resulting HTTP responses in RxJS `Observable`s.

> info **Hint** You can also use any general-purpose Node.js HTTP client library directly, such as [got](https://github.com/sindresorhus/got) or [undici](https://github.com/nodejs/undici).

#### Installation

To get started, install the required dependencies:

```bash
$ npm i --save @nestjs/axios axios
```

#### Getting started

Once the installation is complete, import `HttpModule` into the module that needs `HttpService`:

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

Next, inject `HttpService` through the constructor.

> info **Hint** `HttpModule` and `HttpService` are imported from the `@nestjs/axios` package.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```

> info **Hint** `AxiosResponse` is an interface exported from the `axios` package (`$ npm i axios`).

All `HttpService` request methods return an `AxiosResponse` wrapped in an `Observable`.

#### Configuration

[Axios](https://github.com/axios/axios) accepts a variety of options that customize the behavior of the `HttpService`. See the [Axios request config documentation](https://github.com/axios/axios#request-config) for the full list. To configure the underlying Axios instance, pass an options object to the `register()` method of `HttpModule` when importing it. Nest passes this object directly to `axios.create()`.

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `registerAsync()` method. As with most dynamic modules, Nest provides several techniques for async configuration.

One technique is to use a factory function:

```typescript
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
```

Like other factory providers, the factory function can be [async](/fundamentals/custom-providers#factory-providers-usefactory) and can inject dependencies through `inject`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `HttpModule` using a class instead of a factory:

```typescript
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
```

This construction instantiates `HttpConfigService` inside `HttpModule` and uses it to create an options object. For this to work, `HttpConfigService` has to implement the `HttpModuleOptionsFactory` interface, as shown below. The `HttpModule` calls the `createHttpOptions()` method on the instance of the supplied class.

```typescript
@Injectable()
class HttpConfigService implements HttpModuleOptionsFactory {
  createHttpOptions(): HttpModuleOptions {
    return {
      timeout: 5000,
      maxRedirects: 5,
    };
  }
}
```

To reuse an existing options provider instead of creating a private copy inside the `HttpModule`, use the `useExisting` syntax:

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: HttpConfigService,
});
```

You can also pass `extraProviders` to the `registerAsync()` method. These providers are merged with the module's providers:

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useClass: HttpConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

This is useful when you want to provide additional dependencies to the factory function or the class constructor.

#### Using Axios directly

If the `HttpModule.register()` options aren't enough, or you want to work with the underlying Axios instance created by `@nestjs/axios`, access it through `HttpService#axiosRef`:

```typescript
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Promise<AxiosResponse<Cat[]>> {
    return this.httpService.axiosRef.get('http://localhost:3000/cats');
    //                      ^ AxiosInstance interface
  }
}
```

#### Full example

Since the `HttpService` methods return an `Observable`, you can use the RxJS `firstValueFrom()` or `lastValueFrom()` functions to retrieve the response data as a promise.

```typescript
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response?.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
```

> info **Hint** See the RxJS documentation for [`firstValueFrom`](https://rxjs.dev/api/index/function/firstValueFrom) and [`lastValueFrom`](https://rxjs.dev/api/index/function/lastValueFrom) to learn how they differ.
