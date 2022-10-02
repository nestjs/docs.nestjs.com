### Advanced Concepts

So far we've breezed over a couple of advanced topics in TypeScript like decorators and how the DI system is actually working under the hood. If all you want is a system that works, ou can probably move on to another section, but if you want to get a deeper understanding of how Nest works, this is the section for you.

#### The @Injectable() Decorator

Earlier in the docs we mentioned that "The `@Injectable()` decorator attaches metadata, which declares that `CatsService` is a class that can be managed by the Nest IoC container.". This is only a half truth, in reality, adding the provider to a module's `providers` array is what makes the provider able to be injected via the IoC container. What `@njectable()` is doing is forcing TypeScript to emit metadata about the class's `constructor`, specifically the `design:paramtypes` metadata that will be read at start up. If there is an `@Inject()` decorator in the constructor, by technicality this does enough to make TypeScript emit all the same metadata. Take a look at the compiled JavaScript from the following TypeScript class:

```typescript
export class Foo {
  constructor(private readonly foo: string) {}
}

export class Bar {
  constructor(private readonly bar: string) {}
}

export class FooBar {
  constructor(private readonly foo: Foo, private readonly bar: Bar) {}
}
```

The transpiled code would look like this

```javascript
export class Foo {
    constructor(foo) {
        this.foo = foo;
    }
}
export class Bar {
    constructor(bar) {
        this.bar = bar;
    }
}
export class FooBar {
    constructor(foo, bar) {
        this.foo = foo;
        this.bar = bar;
    }
}
```

Now, let's add the `@Injectable()` decorator to the classes. We get the following output in our `dist`

```javascript
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
let Foo = class Foo {
    constructor(foo) {
        this.foo = foo;
    }
};
Foo = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [String])
], Foo);
export { Foo };
let Bar = class Bar {
    constructor(bar) {
        this.bar = bar;
    }
};
Bar = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [String])
], Bar);
export { Bar };
let FooBar = class FooBar {
    constructor(foo, bar) {
        this.foo = foo;
        this.bar = bar;
    }
};
FooBar = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Foo, Bar])
], FooBar);
export { FooBar };
```

There's a lot going on in the above snippet, so let's ignore the `__decorate` and `__metadata` method definitions and look just at the class portions. Notice that now there are metadata definitions for the `design:paramtypes` metadata key of `[String]` for `Foo` and `Bar` and `[Foo, Bar]` for `FooBar`. This tells Nest what parameters are expected in each position of the constructor for each class.

> info **Hint** When you use `@Inject('SomeString')` Nest will set `design:paramtypes` to `SomeString` for the position that you are decorating.

What Nest will do when reading this metadata is match it up with the class or injection token that exists in the current module's provider list and use that provider in the proper location for the constructor. This is why it is very important to either use a class, or `@Inject()` on the right parameter, and why all decorators cannot be used wherever you want.
