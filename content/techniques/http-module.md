### HTTP module

[Got](https://github.com/sindresorhus/got) is richly featured HTTP client package that is widely used. Nest wraps Got and exposes it via the built-in `HttpModule`. The `HttpModule` exports the `HttpService` class, which exposes Got-based methods to perform HTTP requests. The library also transforms the resulting HTTP responses into `Observables`.

To use the `HttpService`, first import `HttpModule`.

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

Next, inject `HttpService` using normal constructor injection.

> info **Hint** `HttpModule` and `HttpService` are imported from `@nestjs/common` package.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private httpService: HttpService) {}

  findAll(): Observable<Response<Cat[]>> {
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

All `HttpService` methods return a `Response` wrapped in an `Observable` object.

#### Configuration

[Got](https://github.com/sindresorhus/got) can be configured with a variety of options to customize the behavior of the `HttpService`. Read more about them [here](https://github.com/sindresorhus/got#gotextendoptions). To configure the underlying Got instance, pass an optional options object to the `register()` method of `HttpModule` when importing it. This options object will be passed directly to the underlying **Got extends** method.

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

#### APIs

Besides support for a JSON mode client, the `HttpModule` also support a `pagination` and `stream` APIs.

##### Pagination

The `pagination` api exposes two methods i.e. `each` and `all` each with its own dynamics where the latter an observable of each item `Observable<Cat>` from the range while the former returns an observable of the collection of items of the range selected `Observable<Cat[]>`.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private httpService: HttpService) {}

  fetchItemByPages(): Observable<Response<Cat>> {
    return this.httpService.paginate.each('http://localhost:3000/cats');
  }

  fetchItemsByPages(): Observable<Response<Cat[]>> {
    return this.httpService.paginate.all('http://localhost:3000/cats');
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  fetchItemByPages(): Observable<Response<Cat>> {
    return this.httpService.paginate.each('http://localhost:3000/cats');
  }

  fetchItemsByPages(): Observable<Response<Cat[]>> {
    return this.httpService.paginate.all('http://localhost:3000/cats');
  }
}
```

##### Stream

The stream api provides support for http methods to download and/or upload stream data. Further, using the [fromEvent](https://rxjs-dev.firebaseapp.com/api/index/function/fromEvent) creation operator, it provides an event listener-like observable that _emits events of a specific type coming from the given event target_ (as described by rxjs team).

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private httpService: HttpService) {}

  downloadCats() {
    const writableStream = createWriteStream('path/to/file');

    const stream = this
      .httpService
      .stream
      .get('http://localhost:3000/cats');

    stream.on('data').subscribe({
      next(data) {
        writableStream.write(data);
      }
    });

    stream.on('end').subscribe({
      next(data) {
        writableStream.end();
      }
    });
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  downloadCats() {
    const writableStream = createWriteStream('path/to/file');

    const stream = this
      .httpService
      .stream
      .get('http://localhost:3000/cats');

    stream.on('data').subscribe({
      next(data) {
        writableStream.write(data);
      }
    });

    stream.on('end').subscribe({
      next(data) {
        writableStream.end();
      }
    });
  }
}
```

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `registerAsync()` method. As with most dynamic modules, Nest provides several techniques to deal with async configuration.

One technique is to use a factory function:

```typescript
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
```

Like other factory providers, our factory function can be [async](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) and can inject dependencies through `inject`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.getString('HTTP_TIMEOUT'),
    maxRedirects: configService.getString('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `HttpModule` using a class instead of a factory, as shown below.

```typescript
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
```

The construction above instantiates `HttpConfigService` inside `HttpModule`, using it to create an options object. Note that in this example, the `HttpConfigService` has to implement `HttpModuleOptionsFactory` interface as shown below. The `HttpModule` will call the `createHttpOptions()` method on the instantiated object of the supplied class.

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

If you want to reuse an existing options provider instead of creating a private copy inside the `HttpModule`, use the `useExisting` syntax.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```
