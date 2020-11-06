### Introduction

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

Once the installation process is complete, open the `main.ts` file and initialize Swagger using the `SwaggerModule` class:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

The `DocumentBuilder` helps to structure a base document that conforms to the OpenAPI Specification. It provides several methods that allow setting such properties as title, description, version, etc. In order to create a full document (with all HTTP routes defined) we use the `createDocument()` method of the `SwaggerModule` class. This method takes two arguments, an application instance and a Swagger options object. Alternatively, we can provide a third argument, which should be of type `SwaggerDocumentOptions`. More on this in the [Document options section](/openapi/introduction#document-options).

Once we create a document, we can call the `setup()` method. It accepts:

1. the path to mount the Swagger UI
2. an application instance
3. the document object instantiated above

Now you can run the following command to start the HTTP server:

```bash
$ npm run start
```

While the application is running, open your browser and navigate to `http://localhost:3000/api`. You should see the Swagger UI.

<figure><img src="/assets/swagger1.png" /></figure>

The `SwaggerModule` automatically reflects all of your endpoints. Note that the Swagger UI is created using either `swagger-ui-express` or `fastify-swagger`, depending on the platform.

> info **Hint** To generate and download a Swagger JSON file, navigate to `http://localhost:3000/api-json` in your browser (assuming that your Swagger documentation is available under `http://localhost:3000/api`).

### Document options

When creating a document, it is possible to provide some extra options to finetune the library's behavior. These options should be of type `SwaggerDocumentOptions`, which can be the following:

```TypeScript
export interface SwaggerDocumentOptions {
  /**
   * List of modules to include in the specification
   */
  include?: Function[];

  /**
   * Additional, extra models that should be inspected and included in the specification
   */
  extraModels?: Function[];

  /**
   * If `true`, swagger will ignore the global prefix set through `setGlobalPrefix()` method
   */
  ignoreGlobalPrefix?: boolean;

  /**
   * If `true`, swagger will also load routes from the modules imported by `include` modules
   */
  deepScanRoutes?: boolean;

  /**
   * Custom operationIdFactory that will be used to generate the `operationId`
   * based on the `controllerKey` and `methodKey`
   * @default () => controllerKey_methodKey
   */
  operationIdFactory?: (controllerKey: string, methodKey: string) => string;
}
```

For example, if you want to make sure that the library generates operation names like `createUser` instead of `UserController_createUser`, you can set the following:

```TypeScript
const document = SwaggerModule.createDocument(app, options, {
  operationIdFactory = (
    controllerKey: string,
    methodKey: string
  ) => `${methodKey}`;
});
```

#### Example

A working example is available [here](https://github.com/nestjs/nest/tree/master/sample/11-swagger).
