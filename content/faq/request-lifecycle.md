### Request Lifecycle

With the use of pipes, guards, and interceptors, it can get be tiring to try and track down where the request flows and when, especially as global, controller level, and route level components come into play. In general, the request will always flow from middleware, to guards, to interceptors, to pipes and then back to interceptors on the return.

#### Middleware

Middleware run from globally bound middleware (such as those bound from `app.use`) to [module bound middleware](/middleware) which are determined on paths. Middleware are run sequentially in the order they are bound, similarly to how middleware in Express work.

#### Guard

Guards execute on a basis of global to controller to route guards. Also, just like middleware, guards run in the order in which they are bound, i.e.

```typescript
@useGuards(Guard1, Guard2)
@Controller('cats')
export class CatsController {

  constructor(private readonly catsService: CatsService) {}

  @UseGuards(Guard3)
  @Get()
  getCats(): Cats[] {
    return this.catsService.getCats();
  }
}
```

`Guard1` will execute before `Guard2` and both will be executed before `Guard3`.

> info **Hint** When speaking about globally bound vs controller or locally bound, the difference is where the guard (or other component is bound). If you are using `app.useGlobalGuard()` or providing the component via a module, it is globally bound. Otherwise, it is bound to a controller or route.

#### Interceptors

Interceptors, for the most part, follow the same pattern as guards, with one catch: as interceptors return [RxJS Observables](https://github.com/ReactiveX/rxjs), the observables will be resolved in a first in last out manner. So inbound requests will go through the standard global, controller, route level resolution, but the response side of the request (i.e. after leaving the controller) will be resolved from route to controller to interceptor. Also, any errors thrown by pipes, controllers, or services can be read in the `catchError` operator an interceptor.

#### Pipes

Pipes follow the standard global to controller to route bound pipes, with the same first in first out in regards to the `@usePipes()` parameters. However, at a route parameter level, if you have multiple pipes running, they will run in the order of the last parameter with a pipe to the first. This also applies to the route level and controller level pipes as well. For example, if we have the following controller

```typescript
@UsePipes(GeneralValidationPipe)
@Controller('cats')
export class CatsController {

  constructor(private readonly catsService: CatsService) {}

  @usePipes(RouteSpecificPipe)
  @Patch(':id')
  updateCat(@Body() body: UpdateCatDTO, @Param() params: UpdateCatParams, @Query() query: UpdateCatQuery) {
    return this.catsService.updateCat(body, params, query);
  }
}
```

then the `GeneralValidationPipe` will run for the `query`, then the `params`, and then the `body` objects before moving on the the `RouteSpecificPipe` following the same order. If any parameter specific pipes were in place as well, they would be run from the last to first parameter after the controller and route level pipes.

#### Filters

Filters are the only component that do not resolve global first. Instead, filters resolve from the lowest level possible, meaning the route bound filter. Also, exceptions cannot be passed from filter to filter, meaning that if a route level filter catches the exception, a controller or global level filter cannot catch the same exception. The only way to achieve an affect like this is to deal with inheritance between the filters.

#### Conclusion

In general, the request lifecycle looks like the following: 

1. incoming request
1. globally bound middleware
1. module bound middleware
1. global guards
1. controller guards
1. route guards
1. global interceptors (pre-controller)
1. controller interceptors (pre-controller)
1. route interceptors (pre-controller)
1. global pipes
1. controller pipes
1. route pipes
1. route parameter pipes
1. controller
1. service (if exists)
1. route interceptor (post-request)
1. controller interceptor (post-request)
1. global interceptor (post-request)
1. bottom level filter (route, then controller, then global) 
1. server response
