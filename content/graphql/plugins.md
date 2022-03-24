### Plugins

#### For `@nestjs/apollo` driver

Plugins enable you to extend Apollo Server's core functionality by performing custom operations in response to certain events. Currently, these events correspond to individual phases of the GraphQL request lifecycle, and to the startup of Apollo Server itself (read more [here](https://www.apollographql.com/docs/apollo-server/integrations/plugins/)). For example, a basic logging plugin might log the GraphQL query string associated with each request that's sent to Apollo Server.

#### Custom plugins

To create a plugin, declare a class annotated with the `@Plugin` decorator exported from the `@nestjs/apollo` package. Also, for better code autocompletion, implement the `ApolloServerPlugin` interface from the `apollo-server-plugin-base` package.

```typescript
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';

@Plugin()
export class LoggingPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener> {
    console.log('Request started');
    return {
      async willSendResponse() {
        console.log('Will send response');
      },
    };
  }
}
```

With this in place, we can register the `LoggingPlugin` as a provider.

```typescript
@Module({
  providers: [LoggingPlugin],
})
export class CommonModule {}
```

Nest will automatically instantiate a plugin and apply it to the Apollo Server.

#### Using external plugins

There are several plugins provided out-of-the-box. To use an existing plugin, simply import it and add it to the `plugins` array:

```typescript
GraphQLModule.forRoot({
  // ...
  plugins: [ApolloServerOperationRegistry({ /* options */})]
}),
```

> info **Hint** The `ApolloServerOperationRegistry` plugin is exported from the `apollo-server-plugin-operation-registry` package.

#### For `@nestjs/mercurius` driver

There are serveral mercurius specific fastify plugins that have to be loaded after the mercurius plugin (read more [here](https://mercurius.dev/#/docs/plugins)).

> warning **Warning** [mercurius-upload](https://github.com/mercurius-js/mercurius-upload) is an exception and should be registered in the main file.

In order to register these plugins just add them to the plugins array inside an object with the plugin function as the plugin parameter and its options object as the options optional parameter, example:

```typescript
GraphQLModule.forRoot({
  // ...
  plugins: [
    {
      plugin: altair,
      options: {
        path: '/altair',
        baseURL: '/altair/',
        endpointURL: '/api/graphql',
      },
    }
  ]
}),
```
