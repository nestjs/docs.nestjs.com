### Discovery Service

The `DiscoveryService` is a utility provided by `@nestjs/core` that allows developers to dynamically discover providers, controllers, and other metadata within a NestJS application. This can be particularly useful for building plugins, decorators, or features that rely on runtime introspection.

## Installation

`DiscoveryService` is part of `@nestjs/core`, so it does not require separate installation. You can use it directly within your NestJS application.

## Importing DiscoveryService and DiscoveryModule

Before using the `DiscoveryService`, you need to import the `DiscoveryModule` in your module:

```typescript
@@filename(example.module)
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ExampleService } from './example.service';

@Module({
  imports: [DiscoveryModule],
  providers: [ExampleService],
})
export class ExampleModule {}
```

Then, inject `DiscoveryService` into a provider or service:

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

> info **Hint** The `DiscoveryService` class is imported from the `@nestjs/core` package.

## Use Cases

### 1. Discovering Providers

You can retrieve all registered providers in the application:

```typescript
const providers = this.discoveryService.getProviders();
console.log(providers);
```

Each provider object contains information about the instance, token, and metadata.

### 2. Discovering Controllers

Retrieve all registered controllers:

```typescript
const controllers = this.discoveryService.getControllers();
console.log(controllers);
```

### 3. Finding Metadata

`DiscoveryService` can help find metadata attached to providers or controllers. This is useful when working with decorators that add metadata.

```typescript
const providers = this.discoveryService.getProviders();

for (const provider of providers) {
  const metadata = this.reflector.get('custom:metadataKey', provider.instance.constructor);
  if (metadata) {
    console.log(`Metadata found:`, metadata);
  }
}
```

## Example: Custom Decorator with DiscoveryService

Suppose you have a custom decorator that adds metadata to a provider:

```typescript
import { SetMetadata } from '@nestjs/common';

export const CustomMetadata = (value: string) => SetMetadata('custom:metadataKey', value);
```

And you use it in a service:

```typescript
import { Injectable } from '@nestjs/common';
import { CustomMetadata } from './custom-metadata.decorator';

@Injectable()
@CustomMetadata('example-value')
export class CustomService {}
```

Now, you can use `DiscoveryService` to find all providers with this metadata:

```typescript
const providers = this.discoveryService.getProviders();

const filteredProviders = providers.filter((provider) => {
  if (!provider.instance) return null;
  return !!this.reflector.get(metadataPathToken, provider.instance.constructor);
});

console.log('Providers with custom metadata:', filteredProviders);
```

## Conclusion

`DiscoveryService` is a powerful tool for runtime introspection in NestJS applications. It allows you to discover providers, controllers, and metadata dynamically, making it useful for plugin development, custom decorators, and advanced framework-level features.
