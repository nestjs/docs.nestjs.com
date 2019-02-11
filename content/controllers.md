### Controllers

Controllers are responsible for handling incoming **requests** and returning **responses** to the client.

<figure><img src="/assets/Controllers_1.png" /></figure>

A controller's purpose is to receive specific requests for the application. The **routing** mechanism controls which controller receives which requests. Frequently, each controller has more than one route, and different routes can perform different actions.

In order to create a basic controller, we use classes and **decorators**. Decorators associate classes with required metadata and enable Nest to create a routing map (tie requests to the corresponding controllers).

#### Routing

In the following example we'll use the `@Controller()` decorator which is **required** to define a basic controller. We'll specify an optional prefix of `cats`. Using a prefix in a Controller decorator allows us to avoid repeating ourselves when routes could potentially share a common prefix.

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}
```

> info **Hint** To create a controller using CLI, simply execute `$ nest g controller cats` command.

The `@Get()` decorator before the `findAll()` method tells Nest to create an endpoint for this particular route path and map every corresponding request to this handler. Since we've declared a prefix for every route ( `cats`), Nest will map every `/cats` GET request to this method.

When a GET request is made to this endpoint, Nest will now return a 200 status code and the associated response, which in this case is just a string. Why does that happen? Generally, we distinguish **two different approaches** to manipulate responses:

<table>
  <tr>
    <td>Standard (recommended)</td>
    <td>
      When we return a JavaScript object or array, it'll be <strong>automatically</strong>
      serialized to JSON. When we return a string however, Nest will send just a string without attempting to
      serialize it.
      <br />
      <br /> Furthermore, the response's <strong>status code</strong> is always 200 by default, except for POST
      requests
      which use <strong>201</strong>. We can easily change this behaviour by adding the <code>@HttpCode(...)</code>
      decorator
      at a handler-level.
    </td>
  </tr>
  <tr>
    <td>Library-specific</td>
    <td>
      We can use the library specific <a href="http://expressjs.com/en/api.html#res" target="blank">response object</a>,
      which we can inject using the <code>@Res()</code> decorator in the function signature (e.g. <code>findAll(@Res() response)</code>).
    </td>
  </tr>
</table>

> warning **Warning** You can't use both approaches at the same time. Nest detects whether the handler is using either `@Res()` or `@Next()`. If both approaches are used in the same time - the Standard approach is automatically disabled for this single route and will no longer work as expected.

#### Request object

A lot of endpoints need access to the client **request** details. In fact, Nest is using a library-specific (express by default) [request object](http://expressjs.com/en/api.html#req). As a result, we can force Nest to inject the request object into the handler using the `@Req()` decorator.

```typescript
@@filename(cats.controller)
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Bind, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  @Bind(Req())
  findAll(request) {
    return 'This action returns all cats';
  }
}
```

The request object represents the HTTP request and has properties for the request query string, parameters, HTTP headers, and body (read more [here](http://expressjs.com/en/api.html#req)). In most cases, it's not necessary to grab these properties manually. We can use **dedicated decorators** instead, such as `@Body()` or `@Query()`, which are available out of the box. Below is a comparison of the provided decorators and the plain express objects they represent.

<table>
  <tbody>
    <tr>
      <td><code>@Request()</code></td>
      <td><code>req</code></td>
    </tr>
    <tr>
      <td><code>@Response()</code></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(key?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[key]</code></td>
    </tr>
    <tr>
      <td><code>@Body(key?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[key]</code></td>
    </tr>
    <tr>
      <td><code>@Query(key?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[key]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(name?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[name]</code></td>
    </tr>
  </tbody>
</table>

> info **Hint** To learn how to create your own custom decorators, visit [this](/custom-decorators) chapter.

#### Resources

We defined an endpoint to fetch the cats resource (**GET** route). It'll also be great to provide a way of creating new records as well. For this, let's create the **POST** handler:

```typescript
@@filename(cats.controller)
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
@@switch
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create() {
    return 'This action adds a new cat';
  }

  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}
```

It's that simple. Nest provides the rest of those endpoint decorators in the same fashion - `@Put()`, `@Delete()`, `@Patch()`, `@Options()`, `@Head()`, and `@All()`. All of them represent respective HTTP request methods.

#### Route wildcards

Pattern based routes are supported as well. For instance, the asterisk is used as a wildcard, and will match any combination of characters.

```typescript
@Get('ab*cd')
findAll() {
  return 'This route uses a wildcard';
}
```

Above route path will match `abcd`, `ab_cd`, `abecd`, and so on. The characters `?`, `+`, `*`, and `()` are subsets of their regular expression counterparts. The hyphen ( `-`) and the dot (`.`) are interpreted literally by string-based paths.

#### Status code

As mentioned, the response **status code** is always **200** by default, except for POST requests which are **201**. We can easily change this behaviour by adding the `@HttpCode(...)` decorator at a handler-level.

```typescript
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
```

Often, your status code isn't static but depends on various factors. In that case, you can use a library-specific **response** (inject using `@Res()`) object (or, in case of an error, throw an exception).

#### Headers

To specify a custom response header, you can either use a `@Header()` decorator or a library-specific response object.

```typescript
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'This action adds a new cat';
}
```

#### Route parameters

Routes with static paths can't help when you need to accept **dynamic data** as part of the URL. In order to define routes with parameters, we can directly particularise the route parameters in the path of the route.

```typescript
@@filename()
@Get(':id')
findOne(@Param() params): string {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
@@switch
@Get(':id')
@Bind(Param())
findOne(params) {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
```

In order to pick up a particular parameter, simply pass its name in parenthesis.

```typescript
@@filename()
@Get(':id')
findOne(@Param('id') id): string {
  return `This action returns a #${id} cat`;
}
@@switch
@Get(':id')
@Bind(Param('id'))
findOne(id) {
  return `This action returns a #${id} cat`;
}
```

#### Routes order

Be aware that routes registration **order** (methods order in classes) matters. Assume that you have a route that allows getting cats by identifiers (`cats/:id`). If you register another endpoint below the mentioned one, which basically returns all cats at once (`cats`), the request will never hit the actual handler because all path parameters are optional. See the following example:

```typescript
@Controller('cats')
export class CatsController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Get()
  findAll() {
    // This endpoint will never get called
    // because the "/cats" request is going
    // to be captured by the "/cats/:id" route handler
  }
}
```

In order to avoid such side-effects, simply move `findAll()` method above `findOne()`.

#### Scopes

For the people coming from different languages, it might be awkward that in Nest almost everything is shared across the incoming requests. We have a connection pool to the database, singleton services with a global state etc. Generally, Node.js doesn't follow request/response Multi-Threaded Stateless Model in which every request is being processed by the separate thread. Hence, using singleton instances is fully **safe** for our applications.

However, there are edge-cases when request-based lifetime of the controller may be an intentional behavior, for instance per-request cache in GraphQL applications, request tracking or multi-tenancy. Learn how to use them [here](/techniques/scopes).

#### Asynchronousness

We love modern JavaScript and we know that data extraction is mostly **asynchronous**. That's why Nest supports and works well with `async` functions.

> info **Hint** Learn more about `async / await` feature [here](https://kamilmysliwiec.com/typescript-2-1-introduction-async-await)

Every async function has to return a `Promise`. It means that you can return a deferred value that Nest will be able to resolve by itself. Let's see an example of this below:

```typescript
@@filename(cats.controller)
@Get()
async findAll(): Promise<any[]> {
  return [];
}
@@switch
@Get()
async findAll() {
  return [];
}
```

The above code is fully valid. Furthermore, Nest route handlers are even more powerful by being able to return Rx [observable streams](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html). Nest will automatically subscribe to the source underneath and take the last emitted value (once the stream is completed).

```typescript
@@filename(cats.controller)
@Get()
findAll(): Observable<any[]> {
  return of([]);
}
@@switch
@Get()
findAll() {
  return of([]);
}
```

Either of the above approaches work and you can use whatever fits your requirements.

#### Request payloads

Our previous example of the POST route handler didn't accept any client params. Let's fix this by adding the `@Body()` argument here.

But first (if you use TypeScript), we need to determine the **DTO** (Data Transfer Object) schema. A DTO is an object that defines how the data will be sent over the network. We could determine the DTO schema by using **TypeScript** interfaces, or by simple classes. Surprisingly, we recommend using **classes** here. Why? Classes are part of the JavaScript ES6 standard, and therefore they represent plain functions. On the other hand, since TypeScript interfaces are removed during the transpilation, Nest can't refer to them. This is important because features such as **Pipes** enable additional possibilities when they have access to the metatype of the variable.

Let's create the `CreateCatDto` class:

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

It has only three basic properties. Thereafter we can use the newly created schema inside the `CatsController`:

```typescript
@@filename(cats.controller)
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'This action adds a new cat';
}
@@switch
@Post()
@Bind(Body())
async create(createCatDto) {
  return 'This action adds a new cat';
}
```

#### Handling errors

There's a separate chapter about handling errors (i.e. working with exceptions) [here](/exception-filters).

#### Full resource sample

Here is a example that makes use of a few available decorators to create a basic controller. The following controller exposes a couple of methods to access and manipulate internal data.

```typescript
@@filename(cats.controller)
import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, ListAllEntities } from './dto';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `This action removes a #${id} cat`;
  }
}
@@switch
import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(@Query() query) {
    return `This action returns all cats (limit: ${query.limit} items)`;
  }

  @Get(':id')
  findOne(@Param('id') id) {
    return `This action returns a #${id} cat`;
  }

  @Put(':id')
  update(@Param('id') id, @Body() updateCatDto) {
    return `This action updates a #${id} cat`;
  }

  @Delete(':id')
  remove(@Param('id') id) {
    return `This action removes a #${id} cat`;
  }
}
```

#### Getting up and running

With the above controller fully prepared, Nest still doesn't know that `CatsController` exists and as a result won't create an instance of this class.

Controllers always belong to the module, which is why we hold the `controllers` array within the `@Module()` decorator. Since we don't have any other modules except the root `ApplicationModule`, we'll use that to introduce the `CatsController`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class ApplicationModule {}
```

We attached the metadata to the module class, and Nest can now easily reflect which controllers have to be mounted.

#### Appendix: Library-specific approach

So far we've discussed the Nest standard way of manipulating responses. The second way of manipulating the response is to use a library-specific [response object](http://expressjs.com/en/api.html#res). In order to inject a particular response object, we need to use the `@Res()` decorator. To show the differences, let's rewrite the `CatsController` to the following:

```typescript
@@filename()
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
@@switch
import { Controller, Get, Post, Bind, Res, Body, HttpStatus } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Res(), Body())
  create(res, createCatDto) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  @Bind(Res())
  findAll(res) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

Though this approach works, it's much less clear in general. The first approach should always be preferred, but to make Nest **backwards compatible** with previous versions, the above approach is still available. One other thing to note is the **response object** in this approach allows for more flexibility - by allowing us to have full control of the response object (headers manipulation and so on).
