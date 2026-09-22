### Types and parameters

The `SwaggerModule` searches for all `@Body()`, `@Query()`, `@Param()`, and `@Headers()` decorators in route handlers to generate the API document. It also uses reflection to create the corresponding model definitions. Consider the following code:

```typescript
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Hint** To set the body definition explicitly, use the `@ApiBody()` decorator (imported from the `@nestjs/swagger` package).

Based on the `CreateCatDto`, Swagger UI shows the following model definition:

<figure><img src="/assets/swagger-dto.png" /></figure>

The definition is empty, even though the class declares a few properties. To make the class properties visible to the `SwaggerModule`, either annotate them with the `@ApiProperty()` decorator or use the [CLI plugin](/openapi/cli-plugin), which does this automatically:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

> info **Hint** Instead of manually annotating each property, consider using the [Swagger plugin](/openapi/cli-plugin), which adds these annotations for you.

Open the browser and verify the generated `CreateCatDto` model:

<figure><img src="/assets/swagger-dto2.png" /></figure>

The `@ApiProperty()` decorator also lets you set various [Schema Object](https://swagger.io/specification/#schemaObject) properties:

```typescript
@ApiProperty({
  description: 'The age of a cat',
  minimum: 1,
  default: 1,
})
age: number;
```

> info **Hint** Instead of explicitly typing `{{"@ApiProperty({ required: false })"}}`, you can use the `@ApiPropertyOptional()` shorthand decorator.

To set the type of the property explicitly, use the `type` key:

```typescript
@ApiProperty({
  type: Number,
})
age: number;
```

#### Arrays

When the property is an array, you must indicate the array type manually, as shown below:

```typescript
@ApiProperty({ type: [String] })
names: string[];
```

> info **Hint** Consider using the [Swagger plugin](/openapi/cli-plugin), which detects arrays automatically.

Either pass the type as the first element of an array (as shown above) or set the `isArray` property to `true`.

<app-banner-enterprise></app-banner-enterprise>

#### Circular dependencies

When you have circular dependencies between classes, use a lazy function to provide the `SwaggerModule` with type information:

```typescript
@ApiProperty({ type: () => Node })
node: Node;
```

> info **Hint** Consider using the [Swagger plugin](/openapi/cli-plugin), which detects circular dependencies automatically.

#### Generics and interfaces

TypeScript doesn't store metadata about generics or interfaces, so when you use them in your DTOs, the `SwaggerModule` may not be able to generate model definitions correctly at runtime. For instance, the Swagger module can't correctly inspect the following code:

```typescript
createBulk(@Body() usersDto: CreateUserDto[])
```

To overcome this limitation, set the type explicitly:

```typescript
@ApiBody({ type: [CreateUserDto] })
createBulk(@Body() usersDto: CreateUserDto[])
```

#### Enums

To identify an `enum`, set the `enum` property of `@ApiProperty()` to an array of values:

```typescript
@ApiProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;
```

Alternatively, define an actual TypeScript enum as follows:

```typescript
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User',
}
```

You can then use the enum directly with the `@Query()` parameter decorator, in combination with the `@ApiQuery()` decorator:

```typescript
@ApiQuery({ name: 'role', enum: UserRole })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {}
```

<figure><img src="/assets/enum_query.gif" /></figure>

With `isArray` set to `true`, the `enum` values can be selected in a **multi-select**:

<figure><img src="/assets/enum_query_array.gif" /></figure>

#### Enums schema

By default, the `enum` property adds a raw [enum](https://swagger.io/docs/specification/data-models/enums/) definition to the `parameter`:

```yaml
- breed:
    type: 'string'
    enum:
      - Persian
      - Tabby
      - Siamese
```

This specification works for most cases. However, if you use a tool that takes the specification as **input** and generates **client-side** code, the generated code may contain duplicated `enums`. Consider the following code snippet:

```typescript
// generated client-side code
export class CatDetail {
  breed: CatDetailEnum;
}

export class CatInformation {
  breed: CatInformationEnum;
}

export enum CatDetailEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}

export enum CatInformationEnum {
  Persian = 'Persian',
  Tabby = 'Tabby',
  Siamese = 'Siamese',
}
```

> info **Hint** The above snippet is generated using a tool called [NSwag](https://github.com/RicoSuter/NSwag).

The result contains two identical `enums`. To address this issue, pass an `enumName` along with the `enum` property in your decorator:

```typescript
export class CatDetail {
  @ApiProperty({ enum: CatBreed, enumName: 'CatBreed' })
  breed: CatBreed;
}
```

The `enumName` property makes `@nestjs/swagger` turn `CatBreed` into its own `schema`, which makes the `CatBreed` enum reusable. The specification looks like the following:

```yaml
CatDetail:
  type: 'object'
  properties:
    ...
    - breed:
        schema:
          $ref: '#/components/schemas/CatBreed'
CatBreed:
  type: string
  enum:
    - Persian
    - Tabby
    - Siamese
```

> info **Hint** The `@ApiQuery()` and `@ApiParam()` decorators also accept `enumName` alongside `enum`.

#### Property value examples

To set a single example for a property, use the `example` key:

```typescript
@ApiProperty({
  example: 'persian',
})
breed: string;
```

To provide multiple examples, use the `examples` key and pass an object structured like this:

```typescript
@ApiProperty({
  examples: {
    Persian: { value: 'persian' },
    Tabby: { value: 'tabby' },
    Siamese: { value: 'siamese' },
    'Scottish Fold': { value: 'scottish_fold' },
  },
})
breed: string;
```

#### Raw definitions

In certain cases, such as deeply nested arrays or matrices, you may need to define your type manually:

```typescript
@ApiProperty({
  type: 'array',
  items: {
    type: 'array',
    items: {
      type: 'number',
    },
  },
})
coords: number[][];
```

You can also specify raw object schemas:

```typescript
@ApiProperty({
  type: 'object',
  properties: {
    name: {
      type: 'string',
      example: 'Error'
    },
    status: {
      type: 'number',
      example: 400
    }
  },
  required: ['name', 'status']
})
rawDefinition: Record<string, any>;
```

To manually define input/output content in controller classes, use the `schema` property:

```typescript
@ApiBody({
  schema: {
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'number',
      },
    },
  },
})
async create(@Body() coords: number[][]) {}
```

#### Extra models

To define additional models that your controllers don't reference directly but the Swagger module should inspect, use the `@ApiExtraModels()` decorator:

```typescript
@ApiExtraModels(ExtraModel)
export class CreateCatDto {}
```

> info **Hint** You only need to use `@ApiExtraModels()` once for a specific model class.

Alternatively, pass an options object with the `extraModels` property to the `SwaggerModule.createDocument()` method:

```typescript
const documentFactory = () =>
  SwaggerModule.createDocument(app, options, {
    extraModels: [ExtraModel],
  });
```

To get a reference (`$ref`) to your model, use the `getSchemaPath(ExtraModel)` function:

```typescript
'application/vnd.api+json': {
   schema: { $ref: getSchemaPath(ExtraModel) },
},
```

#### oneOf, anyOf, allOf

To combine schemas, use the `oneOf`, `anyOf`, or `allOf` keywords (see [oneOf, anyOf, allOf, not](https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/) in the Swagger documentation):

```typescript
@ApiProperty({
  oneOf: [
    { $ref: getSchemaPath(Cat) },
    { $ref: getSchemaPath(Dog) },
  ],
})
pet: Cat | Dog;
```

To define a polymorphic array (i.e., an array whose members span multiple schemas), use a raw definition (see above) to define your type by hand:

```typescript
type Pet = Cat | Dog;

@ApiProperty({
  type: 'array',
  items: {
    oneOf: [
      { $ref: getSchemaPath(Cat) },
      { $ref: getSchemaPath(Dog) },
    ],
  },
})
pets: Pet[];
```

> info **Hint** The `getSchemaPath()` function is imported from `@nestjs/swagger`.

Both `Cat` and `Dog` must be defined as extra models with the `@ApiExtraModels()` decorator (at the class level).

#### Schema name and description

The name of the generated schema is based on the name of the original model class (for example, the `CreateCatDto` model generates a `CreateCatDto` schema). To change the schema name, use the `@ApiSchema()` decorator:

```typescript
@ApiSchema({ name: 'CreateCatRequest' })
class CreateCatDto {}
```

The model above is translated into the `CreateCatRequest` schema.

By default, the generated schema has no description. To add one, use the `description` attribute:

```typescript
@ApiSchema({ description: 'Description of the CreateCatDto schema' })
class CreateCatDto {}
```

The description is then included in the schema:

```yaml
schemas:
  CreateCatDto:
    type: object
    description: Description of the CreateCatDto schema
```
