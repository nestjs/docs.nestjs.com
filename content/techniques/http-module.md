### HTTP module

[Axios](https://github.com/axios/axios) is rich-feature HTTP client that is widely used in dozens of applications. That's why Nest wraps this package and exposes it by default as a built-in `HttpModule`. The `HttpModule` exports `HttpService` that simply exposes axios-based methods to perform HTTP request, but also, transforms return types into `Observables`.

In order to use a `HttpService`, we need to import `HttpModule`.

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

> info **Hint** The `HttpModule` is exposed from `@nestjs/common` package.

Then, you can inject `HttpService`. This class is easily accessible from `@nestjs/common` package.

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

All methods return `AxiosResponse` wrapped with `Observable` object.

#### Configuration

[Axios](https://github.com/axios/axios) gives a bunch of options that you may take advantage of to make your `HttpService` even more powerful. Read more about them [here](https://github.com/axios/axios#request-config). To configure underlying library instance, use `register()` method of `HttpModule`.

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

All these properties will be passed down to the **axios** constructor.
