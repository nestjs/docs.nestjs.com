### Circular dependency

A circular dependency occurs when two classes depend on each other. For example, class A needs class B, and class B also needs class A. Circular dependencies can arise in Nest between modules and between providers. While circular dependencies should be avoided where possible, you can't always do so. Nest enables resolving circular dependencies using a technique called **forward referencing**.

#### Forward reference

A **forward reference** allows Nest to reference classes which aren't yet defined using the `forwardRef()` utility function. For example, if `CatsService` and `CommonService` depend on each other, both sides of the relationship can use `@Inject()` and the `forwardRef()` utility to resolve the circular dependency. Otherwise Nest won't instantiate them because all of the essential metadata won't be available. Here's an example:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private readonly commonService: CommonService,
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

That covers one side of the relationship. Now let's do the same with `CommonService`:

```typescript
@@filename(common.service)
@Injectable()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private readonly catsService: CatsService,
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

> warning **Warning** The order of instantiation is indeterminate. Make sure your code does not depend on which constructor is called first.

#### Module forward reference

In order to resolve circular dependencies between modules, use the same `forwardRef()` utility on both sides of the modules association. For example:

```typescript
@@filename(common.module)
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```

#### Module reference

Alternatively, you can use `ModuleRef` class to dynamically instantiate one side of the relationship. Learn more about module references [here](/fundamentals/module-ref).
