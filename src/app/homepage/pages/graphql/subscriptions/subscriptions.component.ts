import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsComponent extends BasePageComponent {
  get subscriptionOfficialExample() {
    return `
Subscription: {
  commentAdded: {
    subscribe: () => pubSub.asyncIterator('commentAdded')
  }
}`;
  }

  get resolversWithNames() {
    return `
import { Query, Resolver, Subscription, ResolveProperty } from '@nestjs/graphql';
import { find, filter } from 'lodash';
import { PubSub } from 'graphql-subscriptions';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
];
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 },
];

// example pubsub
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  @Query('author')
  getAuthor(obj, args, context, info) {
    return find(authors, { id: args.id });
  }

  @Subscription()
  commentAdded() {
    return {
      subscribe: () => pubSub.asyncIterator('commentAdded'),
    };
  }

  @ResolveProperty('posts')
  getPosts(author) {
    return filter(posts, { authorId: author.id });
  }
}`;
  }

  get typeDefs() {
    return `
type Author {
  id: Int!
  firstName: String
  lastName: String
  posts: [Post]
}

type Post {
  id: Int!
  title: String
  votes: Int
}

type Query {
  author(id: Int!): Author
}

type Comment {
  id: String
  content: String
}

type Subscription {
  commentAdded(repoFullName: String!): Comment
}`;
  }
}