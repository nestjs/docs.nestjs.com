### Discovery service

The `DiscoveryService`, provided by the `@nestjs/core` package, lets you dynamically inspect and retrieve providers, controllers, and their metadata within a NestJS application. This is particularly useful when building plugins, decorators, or advanced features that rely on runtime introspection, and lets you build more flexible, modular architectures with automated, dynamic behavior.

#### Getting started

Before using `DiscoveryService`, import the `DiscoveryModule` into the module where you intend to use it. This makes the service available for dependency injection:

```typescript
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ExampleService } from './example.service.js';

@Module({
  imports: [DiscoveryModule],
  providers: [ExampleService],
})
export class ExampleModule {}
```

Once the module is set up, you can inject `DiscoveryService` into any provider that needs dynamic discovery:

```typescript
@@filename(example.service)
@Injectable()
export class ExampleService {
  constructor(private readonly discoveryService: DiscoveryService) {}
}
@@switch
@Injectable()
@Dependencies(DiscoveryService)
export class ExampleService {
  constructor(discoveryService) {
    this.discoveryService = discoveryService;
  }
}
```

#### Discovering providers and controllers

A key capability of `DiscoveryService` is retrieving all registered providers in the application, which is useful for dynamically processing providers based on specific conditions. The following snippet retrieves all providers:

```typescript
const providers = this.discoveryService.getProviders();
console.log(providers);
```

Each returned object is an `InstanceWrapper`, which holds information such as the provider's instance, token, and class (`metatype`). Similarly, to retrieve all registered controllers within the application, use:

```typescript
const controllers = this.discoveryService.getControllers();
console.log(controllers);
```

This is useful when controllers need to be processed dynamically, e.g., for analytics tracking or automatic registration mechanisms.

Both methods accept an optional options object. Pass an `include` array of module classes to limit discovery to those modules:

```typescript
const providers = this.discoveryService.getProviders({
  include: [CatsModule],
});
```

#### Extracting metadata

Beyond discovering providers and controllers, `DiscoveryService` also retrieves metadata attached to these components. This is particularly valuable when working with custom decorators that store metadata at runtime.

For example, consider a custom decorator used to tag providers with specific metadata:

```typescript
import { DiscoveryService } from '@nestjs/core';

export const FeatureFlag = DiscoveryService.createDecorator();
```

Applying this decorator to a service stores metadata that can later be queried:

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlag } from './custom-metadata.decorator.js';

@Injectable()
@FeatureFlag('experimental')
export class CustomService {}
```

Once metadata is attached to providers this way, you can use `DiscoveryService` to filter providers based on the assigned metadata. The following snippet retrieves a provider tagged with a specific metadata value:

```typescript
const providers = this.discoveryService.getProviders();

const [provider] = providers.filter(
  (item) =>
    this.discoveryService.getMetadataByDecorator(FeatureFlag, item) ===
    'experimental',
);

console.log(
  'Providers with the "experimental" feature flag metadata:',
  provider,
);
```

Decorators created with `DiscoveryService.createDecorator()` also register the classes they decorate, so you can retrieve only those classes by passing the decorator's `KEY` as the `metadataKey` option, instead of filtering all providers yourself:

```typescript
const providers = this.discoveryService.getProviders({
  metadataKey: FeatureFlag.KEY,
});
```

The same decorator can also be applied to methods. To read method-level metadata, pass the method name as the third argument to `getMetadataByDecorator()`.

#### Conclusion

`DiscoveryService` enables runtime introspection in NestJS applications. By discovering providers, controllers, and their metadata dynamically, it serves as a building block for extensible frameworks, plugins, and automation-driven features, whether you need to scan and process providers, extract metadata for further processing, or build modular architectures.
