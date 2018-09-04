import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mutations',
  templateUrl: './mutations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationsComponent extends BasePageComponent {
  get mutationsExample() {
    return `
Mutation: {
  upvotePost: (_, { postId }) => {
    const post = find(posts, { id: postId });
    if (!post) {
      throw new Error(\`Couldn't find post with id \${postId}\`);
    }
    post.votes += 1;
    return post;
  },
}`;
  }

  get resolversWithNames() {
    return `
import { Query, Mutation, Resolver, ResolveProperty, Parent, Args } from '@nestjs/graphql';
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
    return find(authors, { id: id });
  }

  @Mutation()
  upvotePost(@Args('postId') postId: number) {
    const post = find(posts, { id: postId });
    if (!post) {
      throw new Error(\`Couldn't find post with id \${postId}\`);
    }
    post.votes += 1;
    return post;
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

  @Mutation()
  async upvotePost(@Args('postId') postId: number) {
    return await this.postsService.upvoteById({ id: postId });
  }

  @ResolveProperty('posts')
  async getPosts(@Parent() { id }) {
    return await this.postsService.findAll({ authorId: id });
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

type Mutation {
  upvotePost(postId: Int!): Post
}`;
  }
}
