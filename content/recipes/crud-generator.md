### CRUD generator (TypeScript only)

Over the lifespan of a project, building new features often means adding new resources to the application. Each new resource typically requires the same set of repetitive operations.

#### Introduction

Consider a real-world scenario in which you need to expose CRUD endpoints for two entities, **User** and **Product**. Following best practices, you would have to perform several operations for each entity:

- Generate a module (`nest g mo`) to keep code organized and establish clear boundaries (grouping related components)
- Generate a controller (`nest g co`) to define CRUD routes (or queries/mutations for GraphQL applications)
- Generate a service (`nest g s`) to implement and isolate business logic
- Generate an entity class/interface to represent the resource data shape
- Generate Data Transfer Objects (or inputs for GraphQL applications) to define how the data will be sent over the network

To speed up this repetitive process, the [Nest CLI](/cli/overview) provides a generator (schematic) that generates all of this boilerplate code automatically.

> info **Note** The schematic supports generating **HTTP** controllers, **Microservice** controllers, **GraphQL** resolvers (both code first and schema first), and **WebSocket** Gateways.

#### Generating a new resource

To create a new resource, run the following command in the root directory of your project:

```shell
$ nest g resource
```

The `nest g resource` command generates not only the NestJS building blocks (module, service, and controller classes), but also an entity class, DTO classes, and the test (`.spec`) files.

Here's the generated controller file (for a REST API):

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

The command also creates placeholders for all the CRUD endpoints: routes for REST APIs, queries and mutations for GraphQL, and message handlers for both microservices and WebSocket gateways.

> info **Note** Generated service classes are **not** tied to any specific **ORM (or data source)**, which makes the generator generic enough to meet the needs of any project. By default, all methods contain placeholders that you can populate with the data sources specific to your project.

Likewise, to generate resolvers for a GraphQL application, select `GraphQL (code first)` (or `GraphQL (schema first)`) as your transport layer.

In this case, Nest generates a resolver class instead of a REST API controller:

```shell
$ nest g resource users

> ? What transport layer do you use? GraphQL (code first)
> ? Would you like to generate CRUD entry points? Yes
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
```

> info **Hint** To skip generating test files, pass the `--no-spec` flag, as follows: `nest g resource users --no-spec`.

As shown below, the command not only creates all the boilerplate mutations and queries, but also wires everything together, using the `UsersService`, the `User` entity, and the DTOs.

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';
import { CreateUserInput } from './dto/create-user.input.js';
import { UpdateUserInput } from './dto/update-user.input.js';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
```
