### Operations

In OpenAPI terms, paths are endpoints (resources), such as `/users` or `/reports/summary`, that your API exposes, and operations are the HTTP methods used to manipulate these paths, such as `GET`, `POST` or `DELETE`.

#### Tags

To attach a controller to a specific tag, use the `@ApiTags(...tags)` decorator.

```typescript
@ApiTags('cats')
@Controller('cats')
export class CatsController {}
```

#### Headers

To define custom headers that are expected as part of the request, use `@ApiHeader()`.

```typescript
@ApiHeader({
  name: 'X-MyHeader',
  description: 'Custom header',
})
@Controller('cats')
export class CatsController {}
```

#### Responses

To define a custom HTTP response, use the `@ApiResponse()` decorator.

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
- `@ApiAcceptedResponse()`
- `@ApiNoContentResponse()`
- `@ApiMovedPermanentlyResponse()`
- `@ApiBadRequestResponse()`
- `@ApiUnauthorizedResponse()`
- `@ApiNotFoundResponse()`
- `@ApiForbiddenResponse()`
- `@ApiMethodNotAllowedResponse()`
- `@ApiNotAcceptableResponse()`
- `@ApiRequestTimeoutResponse()`
- `@ApiConflictResponse()`
- `@ApiTooManyRequestsResponse()`
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

To specify a return model for a request, we must create a class and annotate all properties with the `@ApiProperty()` decorator.

```typescript
export class Cat {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  breed: string;
}
```

Then the `Cat` model can be used in combination with the `type` property of the response decorator.

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

#### File upload

You can enable file upload for a specific method with the `@ApiBody` decorator together with `@ApiConsumes()`. Here's a full example using the [File Upload](/techniques/file-upload) technique:

```typescript
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'List of cats',
  type: FileUploadDto,
})
uploadFile(@UploadedFile() file) {}
```

Where `FileUploadDto` is defined as follows:

```typescript
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
```

To handle multiple files uploading, you can define `FilesUploadDto` as follows:

```typescript
class FilesUploadDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
```

#### Extensions

To add an Extension to a request use the `@ApiExtension()` decorator. The extension name must be prefixed with `x-`.

```typescript
@ApiExtension('x-foo', { hello: 'world' })
```

#### Advanced: Generics ApiResponse

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

For client generation tools, this approach poses an ambiguity in how this `PaginatedResponse<TModel>` is being generated for the client. The following snippet is an example of a client generator result of the above **GET** request:

```ts
// Angular
get(): Observable<{ total: number, limit: number, offset: number, results: CatDto[] }>
```

As you can see, the **Return Type** here is ambiguous. To workaround this issue, you can add a `title` property to the `schema` for `ApiPaginatedResponse`:

```ts
export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        title: `PaginatedResponseOf${model.name}`
        allOf: [
          // ...
        ],
      },
    }),
  );
};
```

Now the result of the client generator tool will become:

```ts
// Angular
get(): Observable<PaginatedResponseOfCatDto>
```
