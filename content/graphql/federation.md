### Federation

[Apollo Federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/) offers a means of splitting your monolith GraphQL server into independent microservices. It consists of two components: A gateway and one or more federated microservices. Each microservice holds part of the schema and the gateway merges the schemas into one single schema that can be consumed by the client.

To quote the [Apollo docs](https://blog.apollographql.com/apollo-federation-f260cf525d21), Federation is designed with these core principles:

- Building a graph should be **declarative.** With federation, you compose a graph declaratively from within your schema instead of writing imperative schema stitching code.
- Code should be separated by **concern**, not by types. Often no single team controls every aspect of an important type like a User or Product, so the definition of these types should be distributed across teams and codebases, rather than centralized.
- The graph should be simple for clients to consume. Together, federated services can form a complete, product-focused graph that accurately reflects how it’s being consumed on the client.
- It’s just **GraphQL**, using only spec-compliant features of the language. Any language, not just JavaScript, can implement federation.

> warning **Note** Apollo Federation currently does not support subscriptions, and only the schema-first approach is currently supported due to limitations with the decorators not yet supporting GraphQL directives<sup>[1](https://github.com/MichalLytek/type-graphql/issues/351)</sup>

In the next example, we'll set up a demo application with a gateway and two federated endpoints: a user- and posts service.

#### Federated example: Users

First install the optional dependency for federation: 

```bash
$ npm install --save @apollo/federation`
```

The User service has a simple schema. Note the `@key` directive, it tells the Apollo query planner that a particular instance of User can be fetched if you have its `id`. Also note that we extend the Query type.

```graphql
type User @key(fields: "id") {
  id: ID!
  name: String!
}

extend type Query {
  getUser(id: ID!): User
}
```

Our resolver has one extra method: `resolveReference`. It's called by the Apollo Gateway whenever a related resource requires a User instance. We'll see an example of this in the Posts service later on. Please note the `@ResolveReference` decorator.

```typescript
import { Args, Query, Resolver, ResolveReference } from "@nestjs/graphql";
import { UsersService } from "./users.service";

@Resolver("User")
export class UsersResolvers {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  getUser(@Args("id") id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    return this.usersService.findById(reference.id);
  }
}
```

Finally, we hook everything up in a module together with a `GraphQLFederationModule`. This module accepts the same options as the regular `GraphQLModule`.

```typescript
import { Module } from "@nestjs/common";
import { GraphQLFederationModule } from "@nestjs/graphql";
import { UsersResolvers } from "./users.resolvers";

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: ["**/*.graphql"]
    })
  ],
  providers: [UsersResolvers]
})
export class AppModule {}
```

#### Federated example: Posts

The Posts service references the User type in its schema by marking it with the `extend` keyword. It also adds one property to the User type. Note the `@key` directive used for matching instances of User, and the `@external` directive indicating that the `id` field is managed elsewhere.

```graphql
type Post @key(fields: "id") {
  id: ID!
  title: String!
  body: String!
  user: User
}

extend type User @key(fields: "id") {
  id: ID! @external
  posts: [Post]
}

extend type Query {
  getPosts: [Post]
}
```

Our resolver has one method of interest here: `getUser`. It returns a reference containing `__typename` and any additional properties your application needs to resolve the reference, in this case only an `id`. The `__typename` is used by the GraphQL Gateway to pinpoint the microservice responsible for the User type and request the instance. The User service discussed above will be called on the `resolveReference` method.

```typescript
import { Query, Resolver, Parent, ResolveProperty } from "@nestjs/graphql";
import { PostsService } from "./posts.service";
import { Post } from "./posts.interfaces";

@Resolver("Post")
export class PostsResolvers {
  constructor(private readonly postsService: PostsService) {}

  @Query("getPosts")
  getPosts() {
    return this.postsService.findAll();
  }

  @ResolveProperty("user")
  getUser(@Parent() post: Post) {
    return { __typename: "User", id: post.userId };
  }
}
```

The Posts service has virtually the same module, but is included below for the sake of completeness:

```typescript
import { Module } from "@nestjs/common";
import { GraphQLFederationModule } from "@nestjs/graphql";
import { PostsResolvers } from "./posts.resolvers";

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: ["**/*.graphql"]
    })
  ],
  providers: [PostsResolvers]
})
export class AppModule {}
```

#### Federated example: Gateway

First install the optional dependency for the gateway: `npm install --save @apollo/gateway`.

Our gateway only needs a list of endpoints and will auto-discover the schemas from there. The code for our gateway is therefore very short:

```typescript
import { Module } from "@nestjs/common";
import { GraphQLGatewayModule } from "@nestjs/graphql";

@Module({
  imports: [
    GraphQLGatewayModule.forRoot({
      server: {
        // ... Apollo server options
        cors: true
      },
      gateway: {
        serviceList: [
          { name: "users", url: "http://user-service/graphql" },
          { name: "posts", url: "http://post-service/graphql" }
        ]
      }
    })
  ]
})
export class AppModule {}
```

> info **Hint** Apollo recommends that you don't rely on the service discovery in a production environment but use their [Graph Manager](https://www.apollographql.com/docs/graph-manager/federation/) instead.

#### Sharing context

You can customize the requests between the gateway and federated services using a build service. This allows you to share context about the request. You can easily extend the default `RemoteGraphQLDataSource` and implement one of the hooks. Please refer to [Apollo Docs on RemoteGraphQLDataSource](https://www.apollographql.com/docs/apollo-server/api/apollo-gateway/#remotegraphqldatasource) for more information about the possibilities.

```typescript
import { Module } from "@nestjs/common";
import { GATEWAY_BUILD_SERVICE, GraphQLGatewayModule } from "@nestjs/graphql";
import { RemoteGraphQLDataSource } from "@apollo/gateway";
import { decode } from 'jsonwebtoken';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  async willSendRequest({ request, context }) {
    const { userId } = await decode(context.jwt);
    request.http.headers.set('x-user-id', userId);
  }
}

@Module({
  providers: [
    {
      provide: AuthenticatedDataSource,
      useValue: AuthenticatedDataSource
    },
    {
      provide: GATEWAY_BUILD_SERVICE,
      useFactory: (AuthenticatedDataSource) => {
        return ({ name, url }) => new AuthenticatedDataSource({ url });
      },
      inject: [AuthenticatedDataSource]
    }
  ],
  exports: [GATEWAY_BUILD_SERVICE],
})
class BuildServiceModule {}

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      useFactory: async () => ({
        gateway: {
          serviceList: [/* services */],
        },
        server: {
          context: ({ req }) => ({
            jwt: req.headers.authorization
          })
        }
      }),
      imports: [BuildServiceModule],
      inject: [GATEWAY_BUILD_SERVICE],
    }),
  ],
})
export class AppModule {}
```

#### Async configuration

Both the Federation and Gateway modules support asynchronous initialization using the same `forRootAsync` that's documented in [Quick start](/graphql/quick-start#async-configuration)
