import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-schema-stitching',
  templateUrl: './schema-stitching.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaStitchingComponent extends BasePageComponent {
  get stitchingExample() {
    return `
mergeInfo => ({
  User: {
    chirps: {
      fragment: \`fragment UserFragment on User { id }\`,
      resolve(parent, args, context, info) {
        const authorId = parent.id;
        return mergeInfo.delegate(
          'query',
          'chirpsByAuthorId',
          {
            authorId,
          },
          context,
          info,
        );
      },
    },
  }
})`;
  }

  get stitchNestWay() {
    return `
@Resolver('User')
@DelegateProperty('chirps')
findChirpsByUserId() {
  return (mergeInfo: MergeInfo) => ({
    fragment: \`fragment UserFragment on User { id }\`,
    resolve(parent, args, context, info) {
      const authorId = parent.id;
      return mergeInfo.delegate(
        'query',
        'chirpsByAuthorId',
        {
          authorId,
        },
        context,
        info,
      );
    },
  });
}`;
  }

  get createSchema() {
    return `
configure(consumer) {
  const typeDefs = this.graphQLFactory.mergeTypesByPaths('./**/*.graphql');
  const localSchema = this.graphQLFactory.createSchema({ typeDefs });
  const delegates = this.graphQLFactory.createDelegates();
  const schema = mergeSchemas({
    schemas: [localSchema, chirpSchema, linkTypeDefs],
    resolvers: delegates,
  });

  consumer
    .apply(graphqlExpress(req => ({ schema, rootValue: req })))
    .forRoutes('/graphql');
}`;
  }

  get chirpsSchema() {
    return `
import { makeExecutableSchema } from 'graphql-tools';
    
const chirpSchema = makeExecutableSchema({
  typeDefs: \`
    type Chirp {
      id: ID!
      text: String
      authorId: ID!
    }

    type Query {
      chirpById(id: ID!): Chirp
      chirpsByAuthorId(authorId: ID!): [Chirp]
    }
  \`
});
const linkTypeDefs = \`
  extend type User {
    chirps: [Chirp]
  }

  extend type Chirp {
    author: User
  }
\`;`;
  }
}
