import { ChangeDetectionStrategy, Component } from '@angular/core';
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
import { Query, Resolver, Subscription, ResolveProperty, Parent, Args } from '@nestjs/graphql';
import { find, filter } from 'lodash';
import { PubSub } from 'graphql-subscriptions';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
];
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
];

// example pubsub
const pubSub = new PubSub();

@Resolver('Author')
export class AuthorResolver {
  @Query('author')
  getAuthor(@Args('id') id: number) {
    return find(authors, { id });
  }

  @Subscription()
  commentAdded() {
    return {
      subscribe: () => pubSub.asyncIterator('commentAdded'),
    };
  }

  @ResolveProperty('posts')
  getPosts(@Parent() author) {
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
