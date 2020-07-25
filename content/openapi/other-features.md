### Other features

#### Global prefix

To ignore a global prefix for routes set through `setGlobalPrefix()`, use `ignoreGlobalPrefix`:

```typescript
const document = SwaggerModule.createDocument(app, options, {
  ignoreGlobalPrefix: true,
});
```

#### Multiple specifications

The `SwaggerModule` provides a way to support multiple specifications. In other words, you can serve different documentation, with different UIs, on different endpoints.

To support multiple specifications, your application must be written with a modular approach. The `createDocument()` method takes a 3rd argument, `extraOptions`, which is an object with a property named `include`. The `include` property takes a value which is an array of modules.

You can setup multiple specifications support as shown below:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * createDocument(application, configurationOptions, extraOptions);
   *
   * createDocument method takes an optional 3rd argument "extraOptions"
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

Navigate to `http://localhost:3000/api/cats` to see the Swagger UI for cats:

<figure><img src="/assets/swagger-cats.png" /></figure>

In turn, `http://localhost:3000/api/dogs` will expose the Swagger UI for dogs:

<figure><img src="/assets/swagger-dogs.png" /></figure>

#### Generics ApiResponse

With the ability to provide **Raw Definition**, we can provide **Generics** schema for SwaggerUI. Assume we have the following *generics DTO*

```ts
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;
  
  @ApiProperty()
  limit: number;
  
  @ApiProperty()
  offset: number;
  
  results: TData[];
}
```

We skip decorating `results` because we will be providing **Raw Definition** for it later. Now, let's assume we have the following `CatDto`

```ts
export class CatDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Now, we can start providing a `PaginatedDto<CatDto>` on `CatController`

```ts
@Controller(...)
export class CatController {
  
  @Get()
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedDto) },
        {
          properties: {
            results: {
              type: 'array',
              items: { $ref: getSchemaPath(CatDto) },
            },
          },
        },
      ],
    },
  })
  async get(...): Promise<PaginatedDto<CatDto>> {
    ...
  }
}
```

We are not done. `PaginatedDto` isn't part of any controller by itself so `SwaggerModule` won't be able to scan it
during initialization. But, `nestjs/swagger` provides an `ApiExtraModels()` decorator for such cases.

```ts
@Controller(...)
@ApiExtraModels(PaginatedDto)
export class CatController {
  ...
}
```

> info **Hint** You only need to use `ApiExtraModels` for a specific `Dto` once so find a place where it makes sense for you to do so.

- `getSchemaPath()` returns the OpenAPI Schema path from within the OpenAPI Spec File that `ApiExtraModels` helps `nestjs/swagger` generates,
or `nestjs/swagger` is able to scan automatically.
- `allOf` is a concept that OpenAPI 3 has to cover Inheritance use-cases.

In this case, we tell SwaggerUI that this response will have **allOf** `PaginatedDto` and the `results` property will be of type array and each item will be of type `CatDto`. 
If you run the SwaggerUI now, you'd see the generated `swagger.json` for this specific endpoint like the following:

```json
responses": {
  "200": {
    "description": "",
    "content": {
      "application/json": {
        "schema": {
          "allOf": [
            {
              "$ref": "#/components/schemas/PaginatedDto"
            },
            {
              "properties": {
                "results": {
                  "$ref": "#/components/schemas/CatDto"
                }
              }
            }
          ]
        }
      }
    }
  }
}
```

Now that we know it works, we can create a custom decorator for `PaginatedDto` as follow:

```ts
export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              results: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
```

then we can use `ApiPaginatedResponse` on our endpoint:

```ts
@Get()
@ApiPaginatedResponse(CatDto)
async get(): Promise<PaginatedDto<CatDto>> {}
```

You can modify `ApiPaginatedResponse` as you see fit, maybe make it more generics to handle non-array `results` or maybe different property name than `results`. 
Knowing the capabilities of `nestjs/swagger` APIs, you can totally go wild with it and make sure your OpenAPI Spec is correct and covered.
