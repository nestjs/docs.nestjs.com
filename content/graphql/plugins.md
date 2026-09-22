### Plugins with Apollo

Plugins let you extend Apollo Server's core functionality by performing custom operations in response to certain events. These events correspond to individual phases of the GraphQL request lifecycle, and to the startup of Apollo Server itself (see [plugins](https://www.apollographql.com/docs/apollo-server/integrations/plugins/) in the Apollo documentation). For example, a basic logging plugin might log the GraphQL query string of each request sent to Apollo Server.

#### Custom plugins

To create a plugin, declare a class annotated with the `@Plugin()` decorator, exported from the `@nestjs/apollo` package. For better code autocompletion, also implement the `ApolloServerPlugin` interface from the `@apollo/server` package.

```typescript
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Plugin } from '@nestjs/apollo';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    console.log('Request started');
    return {
      async willSendResponse() {
        console.log('Will send response');
      },
    };
  }
}
```

With this in place, register `LoggingPlugin` as a provider:

```typescript
@Module({
  providers: [LoggingPlugin],
})
export class CommonModule {}
```

Nest automatically instantiates the plugin and applies it to Apollo Server.

#### Using external plugins

Apollo Server provides several plugins out of the box. To use an existing plugin, import it and add it to the `plugins` array:

```typescript
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';

GraphQLModule.forRoot({
  // ...
  plugins: [ApolloServerPluginCacheControl({ defaultMaxAge: 5 })],
}),
```

> info **Hint** The `ApolloServerPluginCacheControl` plugin is exported from the `@apollo/server/plugin/cacheControl` entry point of the `@apollo/server` package.

#### Plugins with Mercurius

Some of the existing Mercurius-specific Fastify plugins must be loaded after the Mercurius plugin in the plugin tree (see [plugins](https://mercurius.dev/#/docs/plugins) in the Mercurius documentation).

> warning **Warning** [mercurius-upload](https://github.com/mercurius-js/mercurius-upload) is an exception: register it in the main file.

For this, `MercuriusDriver` exposes an optional `plugins` configuration option. It takes an array of objects with two properties: `plugin` and its `options`. For example, registering the [cache plugin](https://github.com/mercurius-js/cache) looks like this:

```typescript
GraphQLModule.forRoot({
  driver: MercuriusDriver,
  // ...
  plugins: [
    {
      plugin: cache,
      options: {
        ttl: 10,
        policy: {
          Query: {
            add: true
          }
        }
      },
    }
  ]
}),
```
