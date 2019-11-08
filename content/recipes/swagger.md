### OpenAPI (Swagger)

> warning **Warning** The techniques in this section require TypeScript, and are not available if your app is written using vanilla JavaScript.

The [OpenAPI](https://swagger.io/specification/) specification is a language-agnostic definition format used to describe RESTful APIs. Nest provides a dedicated [module](https://github.com/nestjs/swagger) which allows generating such a specification by leveraging decorators.

#### Installation

To begin using it, we first install the required dependencies.

```bash
$ npm install --save @nestjs/swagger swagger-ui-express
```

If you use fastify, install `fastify-swagger` instead of `swagger-ui-express`:

```bash
$ npm install --save @nestjs/swagger fastify-swagger
```

#### Bootstrap

Once the installation process is complete, open `main.ts` file and initialize Swagger using the `SwaggerModule` class:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);

  const options = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

The `DocumentBuilder` helps to structure a base document that conforms to the OpenAPI Specification. It provides several methods that allow setting such properties like title, description, version, etc. In order to create a full document (with all HTTP routes defined) we use the `createDocument()` method of the `SwaggerModule` class. This method takes two arguments, an application instance and a base Swagger options.

Once we create a document, we can call `setup()` method. It accepts a **(1)** path to mount Swagger UI, **(2)** an application instance, and **(3)** the document that describes an API.

Now you can run the following command to start the HTTP server:

```bash
$ npm run start
```

While the application is running, open your browser and navigate to `http://localhost:3000/api`. You should see Swagger UI.

<figure><img src="/assets/swagger1.png" /></figure>

As you may noticed, the `SwaggerModule` automatically reflects all of your endpoints. Also, in order to display the Swagger UI, `@nestjs/swagger` makes use of either `swagger-ui-express` or `fastify-swagger` depending on the platform.

> info **Hint** If you want to download generated Swagger JSON file, you can navigatet to `http://localhost:3000/api-json` in your browser (assuming that your Swagger documentation is available under `http://localhost:3000/api`).

#### Route parameters

When inspecting defined controllers, the `SwaggerModule` searches for all `@Body()`, `@Query()`, and `@Param()` decorators in route handlers. Hence, the valid document can be created. In addition, the module creates corresponding **models definitions** by taking advantage of the reflection. Look at the following code:

```typescript
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Hint** To explicitly set the body definition use the `@ApiBody()` decorator (`@nestjs/swagger` package).

Based on the `CreateCatDto`, the module definition will be created:

<figure><img src="/assets/swagger-dto.png" /></figure>

As you can see, the definition is empty although the class has a few declared properties. In order to make the class properties visible to the `SwaggerModule`, we have to either annotate them with `@ApiProperty()` decorator or use a CLI plugin (read more in the **Plugin** section):

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

Let's open the browser and verify the generated `CreateCatDto` model:

<figure><img src="/assets/swagger-dto2.png" /></figure>

In addition, the `@ApiProperty()` decorator allows setting various [Schema Object](https://swagger.io/specification/#schemaObject) properties:

```typescript
@ApiProperty({
  description: 'The age of a cat',
  min: 1,
  default: 1,
})
age: number;
```

> info **Hint** Instead of explicitly typing `{{"@ApiProperty({ required: false })"}}` you can use `@ApiPropertyOptional()` short-hand decorator.

In order to explicitly set the type of the property, use `type` key:

```typescript
@ApiProperty({
  type: Number,
})
age: number;
```

#### Enums

To be able for `SwaggerModule` to identify an `enum`, we have to manually set the `enum` property on `@ApiProperty` with an array of values.

```typescript
@ApiProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;
```

You can also define a real `UserRole` enum instead as following:

```typescript
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User',
}
```

Enums can be used by itself with the `@Query()` parameter decorator in combination with the `@ApiQuery()` decorator.

```typescript
@ApiQuery({ name: 'role', enum: UserRole })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {}
```

<figure><img src="/assets/enum_query.gif" /></figure>

With `isArray` set to **true**, the `enum` can be selected as a **multi-select**:

<figure><img src="/assets/enum_query_array.gif" /></figure>

#### Arrays

We have to manually indicate a type when the property is an array:

```typescript
@ApiProperty({ type: [String] })
names: string[];
```

Simply put your type as the first element of an array (as shown above) or set an `isArray` property to `true`.

#### Circular dependencies

When you have cross-references between your classes, ensure to use lazy functions in order to provide a module with a type information lazily.

```typescript
@ApiProperty({ type: () => Node })
node: Node;
```

#### Generics and interfaces

TypeScript does not store any metadata about generics and interfaces. Hence, if you use them to define your DTOs, we may not be able to properly generate model definitons at the runtime.

#### Raw definitions

In some specific scenarios (e.g. deeply nested arrays, matrices), you may want to describe your type by hand.

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

Likewise, in order to define your input/output content manually in controller classes, use `schema` property:

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

In order to define additional models that should be inspected by Swagger module, use `@ApiExtraModels()` decorator:

```typescript
@ApiExtraModels(ExtraModel)
export class CreateCatDto {}
```

#### oneOf, anyOf, allOf

In order to combine schemas, you can use `oneOf`, `anyOf` or `allOf` keywords ([read more](https://swagger.io/docs/specification/data-models/oneof-anyof-allof-not/)).

```typescript
@ApiProperty({
  oneOf: [
    { $ref: getSchemaPath(Cat) },
    { $ref: getSchemaPath(Dog) },
  ],
})
pet: Cat | Dog;
```

> info **Hint** `getSchemaPath()` function is imported from `@nestjs/swagger`.

Both `Cat` and `Dog` has to be defined as extra models using `@ApiExtraModels()` decorator (at the class-level).

#### Multiple specifications

Swagger module provides a way to support multiple specifications. In other words, you can serve different documentations with different UIs on different endpoints.

In order to allow `SwaggerModule` to support multi-spec, your application must be written with modular approach. The `createDocument()` method takes in a 3rd argument: `extraOptions` which is an object where a property `include` expects an array of modules.

You can setup mltiple specifications support as shown below:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);

  /**
   * createDocument(application, configurationOptions, extraOptions);
   *
   * createDocument method takes in an optional 3rd argument "extraOptions"
   * which is an object with "include" property where you can pass an Array
   * of Modules that you want to include in that Swagger Specification
   * E.g: CatsModule and DogsModule will have two separate Swagger Specifications which
   * will be exposed on two different SwaggerUI with two different endpoints.
   */

  const options = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();

  const catDocument = SwaggerModule.createDocument(app, options, {
    include: [CatsModule],
  });
  SwaggerModule.setup('api/cats', app, catDocument);

  const secondOptions = new DocumentBuilder()
    .setTitle('Dogs example')
    .setDescription('The dogs API description')
    .setVersion('1.0')
    .addTag('dogs')
    .build();

  const dogDocument = SwaggerModule.createDocument(app, secondOptions, {
    include: [DogsModule],
  });
  SwaggerModule.setup('api/dogs', app, dogDocument);

  await app.listen(3000);
}
bootstrap();
```

Now you can start your server with the following command:

```bash
$ npm run start
```

Navigate to `http://localhost:3000/api/cats` to see Swagger UI for your cats:

<figure><img src="/assets/swagger-cats.png" /></figure>

While `http://localhost:3000/api/dogs` will expose a Swagger UI for your dogs:

<figure><img src="/assets/swagger-dogs.png" /></figure>

#### Tags

In order to attach a controller to a specific tag, use `@ApiTags(...tags)` decorator.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {}
```

#### Headers

In order to define custom headers that are expected as part of the request, use `@ApiHeader()`.

```typescript
@ApiHeader({
  name: 'Authorization',
  description: 'Auth token',
})
@Controller('cats')
export class CatsController {}
```

#### Responses

To define a custom HTTP response, we use `@ApiResponse()` decorator.

```typescript
@Post()
@ApiResponse({ status: 201, description: 'The record has been successfully created.'})
@ApiResponse({ status: 403, description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Nest provides a set of short-hand **API response** decorators that inherit from the `@ApiResponse` decorator:

- `@ApiOkResponse()`
- `@ApiCreatedResponse()`
- `@ApiBadRequestResponse()`
- `@ApiUnauthorizedResponse()`
- `@ApiNotFoundResponse()`
- `@ApiForbiddenResponse()`
- `@ApiMethodNotAllowedResponse()`
- `@ApiNotAcceptableResponse()`
- `@ApiRequestTimeoutResponse()`
- `@ApiConflictResponse()`
- `@ApiGoneResponse()`
- `@ApiPayloadTooLargeResponse()`
- `@ApiUnsupportedMediaTypeResponse()`
- `@ApiUnprocessableEntityResponse()`
- `@ApiInternalServerErrorResponse()`
- `@ApiNotImplementedResponse()`
- `@ApiBadGatewayResponse()`
- `@ApiServiceUnavailableResponse()`
- `@ApiGatewayTimeoutResponse()`
- `@ApiDefaultResponse()`

```typescript
@Post()
@ApiCreatedResponse({ description: 'The record has been successfully created.'})
@ApiForbiddenResponse({ description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

To specify a return model for the requests, one has to create a class and annotate all properties with the `@ApiProperty()` decorator.

```typescript
export class Cat {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Then, `Cat` model has to be used in combination with the `type` property of the response decorator.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {
  @Post()
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
    type: Cat,
  })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }
}
```

Let's open the browser and verify the generated `Cat` model:

<figure><img src="/assets/swagger-response-type.png" /></figure>

#### Security

To define which security mechanisms should be used for specific operation, use `@ApiSecurity()` decorator.

```typescript
@ApiSecurity('basic')
@Controller('cats')
export class CatsController {}
```

Before you run your application, remember to add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addSecurity('basic', {
  type: 'http',
  scheme: 'basic',
});
```

Some of the most popular authentication techniques are predefined (e.g. `basic` and `bearer`) and therefore you don't have to define security mechanisms manually as shown above.

#### Basic authentication

In order to enable basic authentication, use `@ApiBasicAuth()`.

```typescript
@ApiBasicAuth()
@Controller('cats')
export class CatsController {}
```

Before you run your application, remember to add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addBasicAuth();
```

#### Bearer authentication

In order to enable bearer authentication, use `@ApiBearerAuth()`.

```typescript
@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
```

Before you run your application, remember to add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addBearerAuth();
```

#### OAuth2 authentication

In order to enable OAuth2, use `@ApiOAuth2()`.

```typescript
@ApiOAuth2(['pets:write'])
@Controller('cats')
export class CatsController {}
```

Before you run your application, remember to add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addOAuth2();
```

#### File upload

You can enable file upload for a specific method with the `@ApiBody` decorator together with `@ApiConsumes()`. Here's a full example using [File Upload](/techniques/file-upload) technique:

```typescript
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  name: 'file',
  description: 'List of cats',
  schema: { type: 'string', format: 'binary' }
})
uploadFile(@UploadedFile() file) {}
```

#### Decorators

All of the available OpenAPI decorators has an `Api` prefix to be easily distinguishable from the core decorators. Below is a full list of the exported decorators with a defined use-level (where can be applied).

|                          |                     |
| ------------------------ | ------------------- |
| `@ApiOperation()`        | Method              |
| `@ApiResponse()`         | Method / Controller |
| `@ApiProduces()`         | Method / Controller |
| `@ApiConsumes()`         | Method / Controller |
| `@ApiBearerAuth()`       | Method / Controller |
| `@ApiOAuth2()`           | Method / Controller |
| `@ApiBasicAuth()`        | Method / Controller |
| `@ApiSecurity()`         | Method / Controller |
| `@ApiExtraModels()`      | Method / Controller |
| `@ApiBody()`             | Method              |
| `@ApiParam()`            | Method              |
| `@ApiQuery()`            | Method              |
| `@ApiHeader()`           | Method / Controller |
| `@ApiExcludeEndpoint()`  | Method              |
| `@ApiTags()`             | Method / Controller |
| `@ApiProperty()`         | Model               |
| `@ApiPropertyOptional()` | Model               |
| `@ApiHideProperty()`     | Model               |

#### Plugin

TypeScript metadata reflaction system has several limitations, which make it impossible to, for instance, determine what properties a class consist of or recognize whether a given property is optional or required. However, some of these constraints can be addressed at the compilation time. Hence, we created a plugin that enhances TypeScript compilation process to reduce the boilerplate code.

Swagger plugin will automatically:

- annotate all DTO properties with `@ApiProperty` unless `@ApiHideProperty` is used
- set `required` property depending on the question mark (e.g. `name?: string` = `required: false`)
- set `type` or `enum` property depending on the type (supports arrays as well)
- set `default` property based on the assigned default value
- set several validation rules based on `class-validator` decorators (if `classValidatorShim` set to `true`)
- add response decorator to every endpoint with a proper status and `type` (response model)

In order to enable plugin, simply open `nest-cli.json` (if you use [Nest CLI](/cli/overview)) and add `plugins` configuration:

```javascript
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger/plugin",
        "options": {}
      }
    ]
  }
}
```

You can use `options` to customize the behavior of the plugin. The `options` has to fulfill the following interface:

```typescript
export interface PluginOptions {
  dtoFileNameSuffix?: string;
  controllerFileNameSuffix?: string;
  classValidatorShim?: boolean;
}
```

<table>
  <tr>
    <th>Option</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>dtoFileNameSuffix</code></td>
    <td><code>.dto.ts</code></td>
    <td>DTO (Data Transfer Object) files suffix</td>
  </tr>
  <tr>
    <td><code>controllerFileNameSuffix</code></td>
    <td><code>.controller.ts</code></td>
    <td>Controller files suffix</td>
  </tr>
  <tr>
    <td><code>classValidatorShim</code></td>
    <td><code>false</code></td>
    <td>If set to true, the module will reuse <code>class-validator</code> validation decorators (e.g. <code>@Max(10)</code> will add <code>max: 10</code> to schema definition) </td>
  </tr>
</table>

If you don't use a CLI but rather have a custom `webpack` configuration, you can still use this plugin in combination with `ts-loader`:

```javascript
getCustomTransformers: (program: any) => ({
  before: [require('@nestjs/swagger/plugin').before({}, program)]
}),
```

#### Migration to 4.0

If you used `@nestjs/swagger@3.*` so far, note the following breaking/API changes.

The following decorators have been changed/renamed:

- `@ApiModelProperty` is now `@ApiProperty`
- `@ApiModelPropertyOptional` is now `@ApiPropertyOptional`
- `@ApiResponseModelProperty` is now `@ApiResponseProperty`
- `@ApiImplicitQuery` is now `@ApiQuery`
- `@ApiImplicitParam` is now `@ApiParam`
- `@ApiImplicitBody` is now `@ApiBody`
- `@ApiImplicitHeader` is now `@ApiHeader`
- `@ApiOperation({{ '{' }} title: 'test' {{ '}' }})` is now`@ApiOperation({{ '{' }} summary: 'test' {{ '}' }})`
- `@ApiUseTags` is now `@ApiTags`

`DocumentBuilder` breaking changes (updated method signatures):

- `addTag`
- `addBearerAuth`
- `addOAuth2`
- `setContactEmail` is now `setContact`
- `setHost` has been removed
- `setSchemes` has been removed

The following methods have been added:

- `addServer`
- `addApiKey`
- `addBasicAuth`
- `addSecurity`
- `addSecurityRequirements`

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/11-swagger).
