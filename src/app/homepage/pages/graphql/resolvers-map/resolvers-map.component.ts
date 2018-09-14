import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-resolvers-map',
  templateUrl: './resolvers-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResolversMapComponent extends BasePageComponent {
  get resolvers() {
    return `
@Resolver('Author')
export class AuthorResolver {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly postsService: PostsService,
  ) {}

  @Query()
  async author(@Args('id') id: number) {
    return await this.authorsService.findOneById(id);
  }

  @ResolveProperty()
  async posts(@Parent() author) {
    const { id } = author;
    return await this.postsService.findAll({ authorId: id });
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

  get generateTypings() {
    return `
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
  },
})`;
  }

  get generateTypingsAsClass() {
    return `
GraphQLModule.forRoot({
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class',
  },
})`;
  }

  get generatedTypings() {
    return `
export class Author {
  id: number;
  firstName?: string;
  lastName?: string;
  posts?: Post[];
}

export class Post {
  id: number;
  title?: string;
  votes?: number;
}

export abstract class IQuery {
  abstract author(id: number): Author | Promise<Author>;
}`;
  }

  get validateInput() {
    return `
import { MinLength, MaxLength } from 'class-validator';

export class CreatePostInput {
  @MinLength(3)
  @MaxLength(50)
  title: string;
}`;
  }
}
