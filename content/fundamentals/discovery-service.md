### Discovery service

The `DiscoveryService` provided by the `@nestjs/core` package is a powerful utility that allows developers to dynamically inspect and retrieve providers, controllers, and other metadata within a NestJS application. This is particularly useful when building plugins, decorators, or advanced features that rely on runtime introspection. By leveraging `DiscoveryService`, developers can create more flexible and modular architectures, enabling automation and dynamic behavior in their applications.

#### Getting started

Before using `DiscoveryService`, you need to import the `DiscoveryModule` in the module where you intend to use it. This ensures that the service is available for dependency injection. Below is an example of how to configure it within a NestJS module:

```typescript
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ExampleService } from './example.service';

@Module({
  imports: [DiscoveryModule],
  providers: [ExampleService],
})
export class ExampleModule {}
```

Once the module is set up, `DiscoveryService` can be injected into any provider or service where dynamic discovery is required.

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

One of the key capabilities of `DiscoveryService` is retrieving all registered providers in the application. This is useful for dynamically processing providers based on specific conditions. The following snippet demonstrates how to access all providers:

```typescript
const providers = this.discoveryService.getProviders();
console.log(providers);
```

Each provider object contains information such as its instance, token, and metadata. Similarly, if you need to retrieve all registered controllers within the application, you can do so with:

```typescript
const controllers = this.discoveryService.getControllers();
console.log(controllers);
```

This feature is particularly beneficial for scenarios where controllers need to be processed dynamically, such as analytics tracking, or automatic registration mechanisms.

#### Extracting metadata

Beyond discovering providers and controllers, `DiscoveryService` also enables retrieval of metadata attached to these components. This is particularly valuable when working with custom decorators that store metadata at runtime.

For example, consider a case where a custom decorator is used to tag providers with specific metadata:

```typescript
import { DiscoveryService } from '@nestjs/core';

export const FeatureFlag = DiscoveryService.createDecorator();
```

Applying this decorator to a service allows it to store metadata that can later be queried:

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlag } from './custom-metadata.decorator';

@Injectable()
@FeatureFlag('experimental')
export class CustomService {}
```

Once metadata is attached to providers in this way, `DiscoveryService` makes it easy to filter providers based on assigned metadata. The following code snippet demonstrates how to retrieve providers that have been tagged with a specific metadata value:

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

#### Conclusion

The `DiscoveryService` is a versatile and powerful tool that enables runtime introspection in NestJS applications. By allowing dynamic discovery of providers, controllers, and metadata, it plays a crucial role in building extensible frameworks, plugins, and automation-driven features. Whether you need to scan and process providers, extract metadata for advanced processing, or create modular and scalable architectures, `DiscoveryService` provides an efficient and structured approach to achieving these goals.
