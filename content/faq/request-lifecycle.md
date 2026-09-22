### Request lifecycle

Nest applications handle requests and produce responses in a sequence called the **request lifecycle**. With middleware, pipes, guards, and interceptors in play, it can be challenging to track down where a particular piece of code runs during the request lifecycle, especially when global, controller-level, and route-level components are combined. In general, a request flows through middleware, then guards, then interceptors, then pipes, and finally back through interceptors on the return path (as the response is generated).

#### Middleware

Middleware runs in a specific sequence. First, Nest runs globally bound middleware (such as middleware bound with `app.use()`), and then it runs [module-bound middleware](/middleware), which is matched by path. Middleware runs sequentially in the order it is bound, just like middleware in Express. For middleware bound in different modules, middleware from global modules (decorated with `@Global()`) runs first, then middleware bound in the root module, followed by middleware from the other modules, ordered by their distance from the root module in the import graph.

#### Guards

Guard execution starts with global guards, proceeds to controller guards, and ends with route guards. As with middleware, guards run in the order in which they are bound. For example:

```typescript
@UseGuards(Guard1, Guard2)
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @UseGuards(Guard3)
  @Get()
  getCats(): Cats[] {
    return this.catsService.getCats();
  }
}
```

`Guard1` will execute before `Guard2` and both will execute before `Guard3`.

> info **Hint** "Global", "controller", and "route" refer to where the guard (or other component) is bound. A component registered with `app.useGlobalGuards()` (or a similar method), or provided through a module with the `APP_GUARD` token (or a similar token), is globally bound. Otherwise, it is bound to a controller if the decorator precedes a controller class, or to a route if the decorator precedes a route handler.

#### Interceptors

Interceptors mostly follow the same pattern as guards, with one difference: because interceptors return [RxJS Observables](https://github.com/ReactiveX/rxjs), the observables are resolved in a first-in, last-out manner. Inbound requests go through the standard global, controller, route order, but the response side (i.e., after the route handler returns) is resolved from route to controller to global. Also, any errors thrown by pipes, controllers, or services can be read in an interceptor's `catchError` operator.

#### Pipes

Pipes follow the standard global, controller, route sequence, and pipes passed to `@UsePipes()` run first in, first out. However, at the route parameter level, when several parameters have pipes, the pipes process the last parameter first and the first parameter last. This also applies to route-level and controller-level pipes. For example, consider the following controller:

```typescript
@UsePipes(GeneralValidationPipe)
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @UsePipes(RouteSpecificPipe)
  @Patch(':id')
  updateCat(
    @Body() body: UpdateCatDTO,
    @Param() params: UpdateCatParams,
    @Query() query: UpdateCatQuery,
  ) {
    return this.catsService.updateCat(body, params, query);
  }
}
```

Here, the `GeneralValidationPipe` runs for the `query`, then the `params`, and then the `body` objects before moving on to the `RouteSpecificPipe`, which follows the same order. Any parameter-specific pipes would run (again, from the last parameter to the first) after the controller-level and route-level pipes.

#### Filters

Filters are the only component that don't resolve global first. Instead, filters resolve from the lowest level possible: Nest checks route-bound filters first, then controller-level filters, and finally global filters. Exceptions can't be passed from filter to filter; if a route-level filter catches the exception, a controller-level or global filter can't catch the same exception. To achieve a similar effect, use inheritance between the filters.

> info **Hint** Filters run only when an uncaught exception occurs during request processing. Exceptions you catch yourself (e.g., with `try/catch`) don't trigger exception filters. As soon as an uncaught exception is encountered, the rest of the lifecycle is skipped and the request goes straight to the filter. Exceptions thrown from [middleware](/middleware#error-handling) are handled by the exceptions layer as well, but only **global** exception filters apply, because middleware runs before a route handler is selected.

#### Summary

In general, the request lifecycle looks like this:

1. Incoming request
2. Middleware
   - 2.1. Globally bound middleware
   - 2.2. Module bound middleware
3. Guards
   - 3.1 Global guards
   - 3.2 Controller guards
   - 3.3 Route guards
4. Interceptors (pre-controller)
   - 4.1 Global interceptors
   - 4.2 Controller interceptors
   - 4.3 Route interceptors
5. Pipes
   - 5.1 Global pipes
   - 5.2 Controller pipes
   - 5.3 Route pipes
   - 5.4 Route parameter pipes
6. Controller (method handler)
7. Service (if exists)
8. Interceptors (post-request)
   - 8.1 Route interceptors
   - 8.2 Controller interceptors
   - 8.3 Global interceptors
9. Exception filters
   - 9.1 Route filters
   - 9.2 Controller filters
   - 9.3 Global filters
10. Server response
