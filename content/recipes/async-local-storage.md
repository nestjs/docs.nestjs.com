### Async Local Storage

`AsyncLocalStorage` is a [Node.js API](https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage) (based on the `async_hooks` API) that provides an alternative way of propagating state through the application without needing to explicitly pass it as a function parameter relying on REQUEST scoped providers and their limitations. It is similar to a thread-local storage in other languages.

The main idea of AsyncLocalStorage is that we can _wrap_ some function call with the `AsyncLocalStorage#run` call. All code that is invoked within the wrapped call gets access to the same `store`, which will be unique to each call chain.

In the context of NestJS, that means if we can find a place within the request's lifecycle, where we can wrap the rest of the request's code, we will be able to access and modify state visible only to that request.

#### Custom implementation

While NestJS itself does not provide a built-in support for it, there is a [3rd party package](#nestjs-cls) which supports many use-cases. However, let's first walk through how we could implement it ourselves for the simplest HTTP case, so we can get a better understanding of the whole concept:

1. First, create a new instance of the `AsyncLocalStorage` in some shared source file. Since we're using NestJS, let's also turn it into a custom provider.

```ts
/** als.module.ts */

import { AsyncLocalStorage } from 'async_hooks';
import { Module } from '@nestjs/core';

export const asyncLocalStorage = new AsyncLocalStorage();

@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: asyncLocalStorage,
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule {}
```

2. Since we're only concerned with HTTP, let's use a middleware to wrap the `next` call with the `AsyncLocalStorage#run` call. This will make the `store` available in all enhancers and the rest of the system, since a middleware is the first thing that the request hits.

```ts
/** main.ts */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { asyncLocalStorage } from './als.setup.ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Retrieve the instance from the container
  // (given we've imported the AlsModule in our AppModule).
  const als = app.get(AsyncLocalStorage);

  // Here we can bind the middleware to all routes,
  app.use((req, res, next) => {
    // populate the store with some default values,
    const store = {
      userId: req.headers['x-user-id'],
    };
    // and and pass the "next" function as callback
    // to the "als.run" method with the default store.
    als.run(store, () => next());
  });
}

bootstrap();
```

3. Now, anywhere within the lifecycle of a request, we can access the local store instance

```ts
/** cat.service.ts */

export class CatService {
  constructor(
    private readonly als: AsyncLocalStorage,
    private readonly catRepository: CatRepository,
  ) {}

  getCatForUser() {
    // the "getStore" method will always return the
    // instance associated with the given request
    const userId = this.als.getStore().userId;
    return this.catRepository.getForUser(userId);
  }
}
```

4) That's it. Now you have a way to share request related state without needing to inject the whole `REQUEST` object.

#### NestJS CLS

The `nestjs-cls` package abstracts `AsyncLocalStorage`

> info **info** `nestjs-cls` is a third party package and is not managed by the NestJS core team. Please, report any issues found with the library in the [appropriate repository](https://github.com/Papooch/nestjs-cls/issues).
