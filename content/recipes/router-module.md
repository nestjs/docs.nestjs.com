### Router module

> info **Hint** This chapter is only relevant to HTTP-based applications.

In an HTTP application (e.g., a REST API), the route path for a handler is determined by concatenating the (optional) prefix declared for the controller (inside the `@Controller()` decorator) and any path specified in the method's decorator (e.g., `@Get('users')`). You can learn more about this in the [routing](/controllers#routing) section of the controllers chapter. Additionally, you can define a [global prefix](/faq/global-prefix) for all routes registered in your application, or enable [versioning](/http/versioning).

In some cases, it's useful to define a prefix at the module level, which then applies to all controllers registered inside that module. For example, imagine a REST application that exposes several endpoints used by a specific part of your application called "Dashboard". Instead of repeating the `/dashboard` prefix in each controller, you can use the `RouterModule`, as follows:

```typescript
@Module({
  imports: [
    DashboardModule,
    RouterModule.register([
      {
        path: 'dashboard',
        module: DashboardModule,
      },
    ]),
  ],
})
export class AppModule {}
```

> info **Hint** The `RouterModule` class is exported from the `@nestjs/core` package.

You can also define hierarchical structures, in which each module has `children` modules. The child modules inherit their parent's prefix. In the following example, the `AdminModule` is registered as the parent module of `DashboardModule` and `MetricsModule`:

```typescript
@Module({
  imports: [
    AdminModule,
    DashboardModule,
    MetricsModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          {
            path: 'metrics',
            module: MetricsModule,
          },
        ],
      },
    ]),
  ],
})
export class AppModule {}
```

> info **Hint** Use this feature carefully, as overusing it can make code difficult to maintain over time.

In the example above, every controller registered inside the `DashboardModule` gets an extra `/admin/dashboard` prefix, because the module concatenates paths recursively from top to bottom, parent to children. Likewise, every controller defined inside the `MetricsModule` gets the additional module-level prefix `/admin/metrics`.
