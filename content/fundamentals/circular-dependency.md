### Circular dependency

A circular dependency occurs when two classes depend on each other. For example, class A needs class B, and class B also needs class A. Circular dependencies can arise in Nest between modules and between providers.

Avoid circular dependencies where possible, but you can't always do so. In such cases, Nest lets you resolve circular dependencies between providers in two ways: with **forward referencing**, or by using the **ModuleRef** class to retrieve a provider instance from the DI container. This chapter describes both techniques, as well as how to resolve circular dependencies between modules.

> warning **Warning** A circular dependency can also be caused by using "barrel files" (`index.ts` files) to group imports. Avoid barrel files for module and provider classes. In particular, don't use a barrel file to import files within the same directory as the barrel file, i.e., `cats/cats.controller` should not import `cats` to import the `cats/cats.service` file. For more details, see [this GitHub issue on barrel files and circular dependencies](https://github.com/nestjs/nest/issues/1181#issuecomment-430197191).

#### Forward reference

A **forward reference**, created with the `forwardRef()` utility function, lets Nest reference classes that aren't defined yet. For example, if `CatsService` and `CommonService` depend on each other, both sides of the relationship can use `@Inject()` and the `forwardRef()` utility to resolve the circular dependency. Otherwise, Nest won't instantiate them, because not all of the essential metadata will be available. Here's an example:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CommonService))
export class CatsService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}
```

> info **Hint** The `forwardRef()` function is imported from the `@nestjs/common` package.

That covers one side of the relationship. Now do the same with `CommonService`:

```typescript
@@filename(common.service)
@Injectable()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private catsService: CatsService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CatsService))
export class CommonService {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

> warning **Warning** The order of instantiation is indeterminate. Make sure your code does not depend on which constructor is called first. Circular dependencies that depend on providers with `Scope.REQUEST` can lead to undefined dependencies. See [this GitHub issue on request-scoped circular dependencies](https://github.com/nestjs/nest/issues/5778) for more information.

#### ModuleRef class alternative

An alternative to `forwardRef()` is to refactor your code and use the `ModuleRef` class to retrieve a provider on one side of the (otherwise) circular relationship. Learn more about the `ModuleRef` utility class in the [module reference](/fundamentals/module-ref) chapter.

#### Module forward reference

To resolve circular dependencies between modules, use the same `forwardRef()` utility function on both sides of the module association. For example:

```typescript
@@filename(common.module)
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```

That covers one side of the relationship. Now do the same with `CatsModule`:

```typescript
@@filename(cats.module)
@Module({
  imports: [forwardRef(() => CommonModule)],
})
export class CatsModule {}
```
