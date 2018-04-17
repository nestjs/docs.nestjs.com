import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
];
const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Meteor', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 },
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
import { Query, Resolver, ResolveProperty } from '@nestjs/graphql';
import { find, filter } from 'lodash';

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

@Resolver('Author')
export class AuthorResolver {
  @Query()
  author(obj, args, context, info) {
    return find(authors, { id: args.id });
  }

  @ResolveProperty()
  posts(author, args, context, info) {
    return filter(posts, { authorId: author.id });
  }
}
`;
  }

  get resolversWithNames() {
    return `
import { Query, Resolver, ResolveProperty } from '@nestjs/graphql';
import { find, filter } from 'lodash';

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

@Resolver('Author')
export class AuthorResolver {
  @Query('author')
  getAuthor(obj, args, context, info) {
    return find(authors, { id: args.id });
  }

  @ResolveProperty('posts')
  getPosts(author, args, context, info) {
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
  async getAuthor(obj, args, context, info) {
    const { id } = args;
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty('posts')
  async getPosts(author, args, context, info) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
  }
}`;
  }

  get realWorldExampleJs() {
    return `
@Resolver('Author')
@Dependencies(AuthorsService, PostsService)
export class AuthorResolver {
  constructor(authorsService, postsService) {
    this.authorsService = authorsService;
    this.postsService = postsService;
  }

  @Query('author')
  async getAuthor(obj, args, context, info) {
    const { id } = args;
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty('posts')
  async getPosts(author) {
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
export class AuthorsModule {}`
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
