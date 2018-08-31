import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-resolvers-map',
  templateUrl: './resolvers-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResolversMapComponent extends BasePageComponent {
  get resolversMapExample() {
    return `
import { find, filter } from 'lodash';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
];
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
];

const resolverMap = {
  Query: {
    author(obj, args, context, info) {
      return find(authors, { id: args.id });
    },
  },
  Author: {
    posts(author, args, context, info) {
      return filter(posts, { authorId: author.id });
    },
  },
};`;
  }

  get resolvers() {
    return `
import { Query, Resolver, ResolveProperty, Args, Parent } from '@nestjs/graphql';
import { find, filter } from 'lodash';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
];
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
];

@Resolver('Author')
export class AuthorResolver {
  @Query()
  author(@Args('id') id: number) {
    return find(authors, { id });
  }

  @ResolveProperty()
  posts(@Parent() author) {
    return filter(posts, { authorId: author.id });
  }
}
`;
  }

  get resolversWithNames() {
    return `
import { Query, Resolver, ResolveProperty, Parent, Args } from '@nestjs/graphql';
import { find, filter } from 'lodash';

// example data
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
];
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
];

@Resolver('Author')
export class AuthorResolver {
  @Query('author')
  getAuthor(@Args('id') id: number) {
    return find(authors, { id });
  }

  @ResolveProperty('posts')
  getPosts(@Parent() author) {
    return filter(posts, { authorId: author.id });
  }
}`;
  }

  get realWorldExample() {
    return `
@Resolver('Author')
export class AuthorResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly postsService: PostsService,
  ) {}

  @Query('author')
  async getAuthor(@Args('id') id: number) {
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty('posts')
  async getPosts(@Parent() author) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
  }
}`;
  }

  get authorsModule() {
    return `
@Module({
  imports: [PostsModule],
  providers: [AuthorsService, AuthorResolver],
})
export class AuthorsModule {}`;
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
}`;
  }
}
