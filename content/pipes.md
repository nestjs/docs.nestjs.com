### Pipes

A pipe is a class annotated with the `@Injectable()` decorator. The pipe should implement the `PipeTransform` interface.

<figure>
  <img src="/assets/Pipe_1.png" />
</figure>

A pipe **transforms** the input data to the desired output. Also, it could take care of the **validation**, since it's possible to throw an exception when the data is incorrect.

> info **Hint** The pipe runs inside the exceptions zone. This means that when exceptions are thrown they are handled by the core exceptions handler and [exceptions filters](/exception-filters) that are applied to the current context.

#### Built-in pipes

Nest comes with two pipes available right out-of-the-box, `ValidationPipe` and `ParseIntPipe`. They're exported from the `@nestjs/common` package. In order to better understand how do they work, we're gonna build them from scratch.

#### What does it look like?

Let's start with the `ValidationPipe`. Initially, it only takes a value and immediately returns the same value, behaving like an identity function.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationPipe {
  transform(value, metadata) {
    return value;
  }
}
```

> info **Hint** The `PipeTransform<T, R>` is a generic interface in which `T` indicates a type of the input `value`, while `R` the return type of the `transform()` method.

Every pipe has to provide the `transform()` method. This method takes two arguments:

- `value`
- `metadata`

The `value` is the currently processed parameter, while `metadata` is its metadata. The metadata object holds a few properties:

```typescript
export interface ArgumentMetadata {
  readonly type: 'body' | 'query' | 'param' | 'custom';
  readonly metatype?: Type<any>;
  readonly data?: string;
}
```

These properties describe the input parameter.

<table>
  <tr>
    <td>
      <code>type</code>
    </td>
    <td>Tells us whether the property is a body
      <code>@Body()</code>, query
      <code>@Query()</code>, param
      <code>@Param()</code>, or a custom parameter (read more
      <a routerLink="/custom-decorators">here</a>).</td>
  </tr>
  <tr>
    <td>
      <code>metatype</code>
    </td>
    <td>
      The metatype of the property, for example,
      <code>String</code>. It's
      <code>undefined</code> either if you omit the type declaration in the function signature, or you use a vanilla JavaScript.
    </td>
  </tr>
  <tr>
    <td>
      <code>data</code>
    </td>
    <td>The string passed to the decorator, for example
      <code>@Body('string')</code>. It's
      <code>undefined</code> if you leave the parenthesis empty.</td>
  </tr>
</table>

> warning **Warning** TypeScript interfaces disappear during the transpilation. Hence, if you use an interface instead of a class, the `metatype` value will be equal to `Object`.

#### What's the point?

Let's focus on the `create()` method of the `CatsController` for a while.

```typescript
@@filename()
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
async create(@Body() createCatDto) {
  this.catsService.create(createCatDto);
}
```

There's a `CreateCatDto` body parameter:

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
```

This object always has to be correct, and thus we have to validate these three members. We could do it inside the route handler method, but we would break the **single responsibility rule** (SRP). The second idea is to create a **validator class** and delegate the task there, but we'll have to use this validator every time at the beginning of each method. So what about the validation middleware? It's a good idea, but it's impossible to create a **generic middleware** which could be used across the whole application.

That's the first use-case, when you should consider to use a **Pipe**.

#### Object schema validation

One of the frequently encountered approaches is to use a **schema-based** validation. The [Joi](https://github.com/hapijs/joi) library is a tool that allows you creating schemas in a pretty straightforward way with a readable API. In order to create a pipe that makes use of object schemas, we need to create a simple class that takes a schema as a `constructor` argument.

```typescript
@@filename()
import * as Joi from 'joi';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: Object) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const { error } = Joi.validate(value, this.schema);
    if (error) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}
@@switch
import * as Joi from 'joi';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe {
  constructor(schema) {
    this.schema = schema;
  }

  transform(value, metadata) {
    const { error } = Joi.validate(value, this.schema);
    if (error) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}
```

#### Binding pipes

The pipe tying is extremely simple - we need to use `@UsePipes()` decorator and create a pipe instance with the valid Joi schema.

```typescript
@@filename()
@Post()
@UsePipes(new JoiValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Bind(Body())
@UsePipes(new JoiValidationPipe(createCatSchema))
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

#### Class validator

##### This section applies only to TypeScript.

Nest works well with the [class-validator](https://github.com/pleerock/class-validator). This amazing library allows you to use decorator-based validation. Decorator based validation is really powerful with the **pipe** capabilities since we have access to the `metatype` of the processed property. However, before we start, we need to install required packages:

```bash
$ npm i --save class-validator class-transformer
```

Once the libraries are installed, we can add a few decorators to the `CreateCatDto` class.

```typescript
@@filename(create-cat.dto)
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  readonly name: string;

  @IsInt()
  readonly age: number;

  @IsString()
  readonly breed: string;
}
```

When it's done, we can create a `ValidationPipe` class.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

> warning **Notice** We have used the [class-transformer](https://github.com/pleerock/class-transformer) library. It's made by the same author as the **class-validator** library, and as a result, they play very well together.

Let's go through this code. Firstly, note that the `transform()` function is `async`. It's possible because Nest supports both synchronous and **asynchronous** pipes. Also, there's a helper function - `toValidate()`. It's responsible for excluding the native JavaScript types from the validation process due to performance reasons. The last worth mentioning part is that we have to return the same value. This pipe is a validation specific pipe, thus we need to return the exact same property to avoid **overriding** (as noted earlier, pipe transforms input to the desired output).

The last step is to set up the `ValidationPipe`. Pipes, same as [exception filters](/exception-filters) can be method-scoped, controller-scoped, and global-scoped. Additionally, a pipe can be param-scoped. We can directly tie the pipe instance to the route param decorator, for example, to `@Body()` decorator. Let's have a look at the below example:

```typescript
@@filename(cats.controller)
@Post()
async create(
  @Body(new ValidationPipe()) createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

The param-scoped pipes are useful when the validation logic concerns only one, specified parameter. In order to set up a pipe at a method level, you'll need the `UsePipes()` decorator.

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe())
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Hint** The `@UsePipes()` decorator is imported from the `@nestjs/common` package.

The instance of `ValidationPipe` has been created immediately in-place. Another available way is to pass the class (not instance), leaving framework the instantiation responsibility and enabling **dependency injection**.

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(ValidationPipe)
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Since the `ValidationPipe` was created to be as generic as possible, we're gonna set it up as a **global-scoped** pipe, for every route handler across the entire application.

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

> warning **Notice** The `useGlobalPipes()` method doesn't set up pipes for gateways and micro services (whereas hybrid app feature is being used).

The global pipes are used across the whole application, for every controller and every route handler. In terms of dependency injection, global pipes registered from the outside of any module (as in the previous example above) cannot inject dependencies since they don't belong to any module. In order to solve this issue, you can set up a pipe **directly from any module** using following construction:

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

> info **Hint** The alternative option is to use an [application context](/application-context) feature. Also, `useClass` is not the only way of dealing with custom providers registration. Learn more [here](/fundamentals/dependency-injection).

#### Transformer pipe

Validation isn't the sole use case. At the beginning of this chapter, we have mentioned that a pipe can also **transform** the input data to the desired output. It's true because the value returned from the `transform` function completely overrides the previous value of the argument. Sometimes the data passed from the client needs to undergo some changes. Also, some parts could be missed, therefore we must apply the default values. The **transformer pipes** fill the gap between the request of the client and the request handler.

```typescript
@@filename(parse-int.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
@@switch
import { Injectable, BadRequestException} from '@nestjs/common';

@Injectable()
export class ParseIntPipe {
  transform(value, metadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

Here's a `ParseIntPipe` which is responsible for parsing a string into an integer value. We can simply tie a pipe to the selected param:

```typescript
@@filename()
@Get(':id')
async findOne(@Param('id', new ParseIntPipe()) id) {
  return await this.catsService.findOne(id);
}
@@switch
@Get(':id')
@Bind(Param('id', new ParseIntPipe()))
async findOne(id) {
  return await this.catsService.findOne(id);
}
```

Thanks to the above construction, `ParseIntPipe` will be executed before request even touches the corresponding handler.

Another useful case would be to select an **existing user** entity from the database by id:

```typescript
@@filename()
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}
@@switch
@Get(':id')
@Bind(Param('id', UserByIdPipe))
findOne(userEntity) {
  return userEntity;
}
```

#### A built-in ValidationPipe

Fortunately, you don't have to build those pipes on your own since the `ValidationPipe` and the `ParseIntPipe` are built-in pipes (keep in mind that `ValidationPipe` requires both `class-validator` and `class-transformer` packages installed).

The built-in `ValidationPipe` offers more options than that one described in this chapter, which has been kept basic for the sake of simplicity and to reduce the learning curve. You can check lots of examples [here](/techniques/validation).

If you take a look at the `createCatDto` in your controller function, you will notice that it isn't an actual `CreateCatDto` instance. That is because this pipe only validates the payload, without transforming it into the expected type. However, if you want the pipe to mutate the payload, you can configure it by passing appropriate options:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Hint** The `ValidationPipe` is imported from the `@nestjs/common` package.

Because this pipe is based on the `class-validator` and the `class-transformer` libraries, it is possible to get more of it. Have a look at the constructor optional options.

```typescript
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

There is a `transform` attribute and all `class-validator` options (inherited from the `ValidatorOptions` interface):

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>skipMissingProperties</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validator will skip validation of all properties that are missing in the validating object.</td>
  </tr>
  <tr>
    <td><code>whitelist</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, validator will strip validated object of any properties that do not make use of any decorators.</td>
  </tr>
  <tr>
    <td><code>forbidNonWhitelisted</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, instead of stripping non-whitelisted properties validator will throw an exception.</td>
  </tr>
  <tr>
    <td><code>forbidUnknownValues</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, the validation of unknown objects would fail immediately.</td>
  </tr>
  <tr>
    <td><code>disableErrorMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, the validation errors would not be forwarded to the client.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Function</code></td>
    <td>If takes an array of the validation errors and returns an exception object that has to be thrown.</td>
  </tr>
  <tr>
    <td><code>groups</code></td>
    <td><code>string[]</code></td>
    <td>Groups to be used during validation of the object.</td>
  </tr>
  <tr>
    <td><code>dismissDefaultMessages</code></td>
    <td><code>boolean</code></td>
    <td>If set to true, the validation will not use default messages. Error message always will be <code>undefined</code>        if
      its not explicitly set.</td>
  </tr>
  <tr>
    <td><code>validationError.target</code></td>
    <td><code>boolean</code></td>
    <td>Indicates if target should be exposed in <code>ValidationError</code></td>
  </tr>
  <tr>
    <td><code>validationError.value</code></td>
    <td><code>boolean</code></td>
    <td>Indicates if validated value should be exposed in <code>ValidationError</code>.</td>
  </tr>
</table>

> info **Notice** You may find more information about the `class-validator` package in its [repository](https://github.com/typestack/class-validator).
