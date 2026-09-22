### File upload and streaming

This chapter covers files in both directions: receiving files that clients upload, and [streaming files](#streaming-files) back to clients.

To handle file uploads, Nest provides a built-in module based on the [multer](https://github.com/expressjs/multer) middleware package for Express. Multer handles data posted in the `multipart/form-data` format, which is primarily used to upload files with an HTTP `POST` request. The module is fully configurable, so you can adjust its behavior to your application's requirements.

> warning **Warning** Multer cannot process data that is not in the `multipart/form-data` format. The module is not compatible with the `FastifyAdapter`.

For type safety, install the Multer type definitions:

```shell
$ npm i -D @types/multer
```

With this package installed, you can use the `Express.Multer.File` type (import the `Express` namespace with `import {{ '{' }} Express {{ '}' }} from 'express'`).

#### Basic example

To upload a single file, bind the `FileInterceptor()` interceptor to the route handler and extract the file from the request with the `@UploadedFile()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
@@switch
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}
```

> info **Hint** The `FileInterceptor()` decorator is exported from the `@nestjs/platform-express` package. The `@UploadedFile()` decorator is exported from `@nestjs/common`.

The `FileInterceptor()` decorator takes two arguments:

- `fieldName`: the name of the HTML form field that holds the file
- `options`: an optional object of type `MulterOptions`. This is the same object the Multer constructor accepts (see the [Multer options](https://github.com/expressjs/multer#multeropts)).

> warning **Warning** `FileInterceptor()` may not be compatible with third party cloud providers like Google Firebase or others.

#### File validation

You will often want to validate incoming file metadata, such as the file size or MIME type. To do so, create a [pipe](/pipes) and bind it to the parameter decorated with `@UploadedFile()`. The following example implements a basic file size validation pipe:

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // "value" is an object containing the file's attributes and metadata
    const oneKb = 1000;
    return value.size < oneKb;
  }
}
```

Use it together with the `FileInterceptor` as follows:

```typescript
@Post('file')
@UseInterceptors(FileInterceptor('file'))
uploadFileAndValidate(@UploadedFile(
  new FileSizeValidationPipe(),
  // other pipes can be added here
) file: Express.Multer.File, ) {
  return file;
}
```

For common cases, Nest provides a built-in pipe, `ParseFilePipe`, which also standardizes how new file validations are added:

```typescript
@Post('file')
uploadFileAndPassValidation(
  @Body() body: SampleDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        // ... Set of file validator instances here
      ]
    })
  )
  file: Express.Multer.File,
) {
  return {
    body,
    file: file.buffer.toString(),
  };
}
```

`ParseFilePipe` requires an array of file validators to execute. The validator interface is described below. The pipe also accepts two **optional** options:

<table>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td>The HTTP status code to be thrown in case <b>any</b> validator fails. Default is <code>400</code> (BAD REQUEST)</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td>A factory which receives the error message and returns an error.</td>
  </tr>
</table>

Validators used by this pipe are either built-in implementations or your own subclasses of the abstract `FileValidator` class:

```typescript
export abstract class FileValidator<TValidationOptions = Record<string, any>> {
  constructor(protected readonly validationOptions: TValidationOptions) {}

  /**
   * Indicates if this file should be considered valid, according to the options passed in the constructor.
   * @param file the file from the request object
   */
  abstract isValid(file?: any): boolean | Promise<boolean>;

  /**
   * Builds an error message in case the validation fails.
   * @param file the file from the request object
   */
  abstract buildErrorMessage(file: any): string;
}
```

> info **Hint** The `isValid()` method can be asynchronous. For type safety, type the `file` parameter as `Express.Multer.File` when you use Express (the default HTTP adapter).

A `FileValidator` receives the file object and validates it according to the options passed to its constructor. Nest provides two built-in implementations:

- `MaxFileSizeValidator` checks that the file's size is less than the provided value, in bytes.
- `FileTypeValidator` checks that the file's MIME type matches the given string or regular expression. By default, it determines the MIME type from the file content's [magic number](https://www.ibm.com/support/pages/what-magic-number).

The following snippet uses both validators with `ParseFilePipe`:

```typescript
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 1000 }),
      new FileTypeValidator({ fileType: 'image/jpeg' }),
    ],
  }),
)
file: Express.Multer.File,
```

> info **Hint** If the list of validators grows long, define the array in a separate file and import it as a named constant, such as `fileValidators`.

Alternatively, compose the validators with the `ParseFilePipeBuilder` class. The builder instantiates each validator for you, so you pass only their options:

```typescript
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'jpeg',
    })
    .addMaxSizeValidator({
      maxSize: 1000
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    }),
)
file: Express.Multer.File,
```

> info **Hint** A file is required by default. To make it optional, pass `fileIsRequired: false` in the options of the `build()` method (next to `errorHttpStatusCode`).

#### Array of files

To upload an array of files identified by a single field name, use the `FilesInterceptor()` decorator (note the plural **Files** in its name). It takes three arguments:

- `fieldName`: as described above
- `maxCount`: an optional maximum number of files to accept
- `options`: an optional `MulterOptions` object, as described above

When using `FilesInterceptor()`, extract files from the `request` with the `@UploadedFiles()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}
```

> info **Hint** The `FilesInterceptor()` decorator is exported from the `@nestjs/platform-express` package. The `@UploadedFiles()` decorator is exported from `@nestjs/common`.

#### Validating an array of files

To validate an array of uploaded files, pass a pipe built with `ParseFilePipeBuilder` to the `@UploadedFiles()` decorator. The registered validators run against each file in the array.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files', 5))
uploadFiles(
  @UploadedFiles(
    new ParseFilePipeBuilder()
      .addFileTypeValidator({
        fileType: /^image\/(jpeg|png|gif)$/,
      })
      .addMaxSizeValidator({ maxSize: 5242880 })
      .build({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
  )
  files: Array<Express.Multer.File>,
) {
  console.log(files);
}
```

#### Multiple files

To upload multiple files under different field names, use the `FileFieldsInterceptor()` decorator. It takes two arguments:

- `uploadedFields`: an array of objects, each with a required `name` property (the field name) and an optional `maxCount` property
- `options`: an optional `MulterOptions` object, as described above

When using `FileFieldsInterceptor()`, extract files from the `request` with the `@UploadedFiles()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}
```

#### Any files

To accept files under any field names, use the `AnyFilesInterceptor()` decorator. It accepts an optional `options` object, as described above.

When using `AnyFilesInterceptor()`, extract files from the `request` with the `@UploadedFiles()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(AnyFilesInterceptor())
uploadFile(files) {
  console.log(files);
}
```

#### No files

To accept `multipart/form-data` without allowing file uploads, use the `NoFilesInterceptor`. It sets the multipart fields as properties of the request body. A request that contains files is rejected with a `BadRequestException`.

```typescript
@Post('upload')
@UseInterceptors(NoFilesInterceptor())
handleMultiPartData(@Body() body) {
  console.log(body)
}
```

#### Default options

You can pass Multer options to each file interceptor, as described above. To set default options instead, call the static `register()` method when you import the `MulterModule`. It accepts all [Multer options](https://github.com/expressjs/multer#multeropts).

```typescript
MulterModule.register({
  dest: './upload',
});
```

> info **Hint** The `MulterModule` class is exported from the `@nestjs/platform-express` package.

#### Async configuration

To set `MulterModule` options asynchronously instead of statically, use the `registerAsync()` method. As with most dynamic modules, it supports several techniques for async configuration.

One technique is to use a factory function:

```typescript
MulterModule.registerAsync({
  useFactory: () => ({
    dest: './upload',
  }),
});
```

Like other [factory providers](/fundamentals/custom-providers#factory-providers-usefactory), the factory function can be `async` and can inject dependencies through `inject`.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.get<string>('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `MulterModule` using a class instead of a factory, as shown below:

```typescript
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
```

The construction above instantiates `MulterConfigService` inside `MulterModule` and calls its `createMulterOptions()` method to obtain the options object. For this to work, `MulterConfigService` must implement the `MulterOptionsFactory` interface:

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './upload',
    };
  }
}
```

If you want to reuse an existing options provider instead of creating a private copy inside the `MulterModule`, use the `useExisting` syntax.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

You can also pass `extraProviders` to the `registerAsync()` method. These providers are merged with the module's providers.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useClass: ConfigService,
  extraProviders: [MyAdditionalProvider],
});
```

This is useful when the factory function or the class constructor needs additional dependencies.

#### Example

A working example of file uploads is available [here](https://github.com/nestjs/nest/tree/master/sample/29-file-upload).

#### Streaming files

To send a file from a route handler, you could pipe a stream into the response object:

```typescript
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
```

With this approach, the handler takes over the response, so post-controller [interceptor](/interceptors) logic no longer runs. Instead, return a `StreamableFile` instance, and Nest pipes it into the response for you.

> info **Note** Streaming files applies to **HTTP applications**. The examples below do not apply to GraphQL or microservice applications.

##### Streamable file class

A `StreamableFile` holds the content to be sent. Its constructor accepts either a `Readable` stream or a `Uint8Array` (including a `Buffer`). The following example returns the `package.json` file instead of a JSON response. The same approach works for images, documents, and any other file type:

```typescript
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```

> info **Hint** The `StreamableFile` class is exported from the `@nestjs/common` package.

Neither the `ClassSerializerInterceptor` nor the `StandardSchemaSerializerInterceptor` [serializes](/application/serialization) `StreamableFile` responses.

##### Response headers

By default, the `Content-Type` response header is `application/octet-stream`. To change it, and to set the `Content-Disposition` and `Content-Length` headers, pass the `type`, `disposition`, and `length` options to the `StreamableFile` constructor:

```typescript
@Get()
getFile(): StreamableFile {
  const file = createReadStream(join(process.cwd(), 'package.json'));
  return new StreamableFile(file, {
    type: 'application/json',
    disposition: 'attachment; filename="package.json"',
  });
}
```

When the content is a `Uint8Array`, `length` defaults to its size. For streams, set `length` yourself if you know the size in advance.

Headers with static values can also be set with the [`@Header()`](/controllers#response-headers) decorator:

```typescript
@Get()
@Header('Content-Type', 'application/json')
@Header('Content-Disposition', 'attachment; filename="package.json"')
getFile(): StreamableFile {
  const file = createReadStream(join(process.cwd(), 'package.json'));
  return new StreamableFile(file);
}
```

To compute headers at runtime, inject the response object with `passthrough` enabled, so that Nest still sends the returned `StreamableFile`:

```typescript
import type { Response } from 'express';

@Get()
getFile(@Res({ passthrough: true }) res: Response): StreamableFile {
  const file = createReadStream(join(process.cwd(), 'package.json'));
  res.set({
    'Content-Type': 'application/json',
    'Content-Disposition': 'attachment; filename="package.json"',
  });
  return new StreamableFile(file);
}
```

##### Stream errors

With the Express adapter, if the stream emits an error before any data has been sent, the client receives a `400 Bad Request` response with the error message as its body. If data has already been sent, the response is ended. To customize this behavior, pass a handler to the `setErrorHandler()` method:

```typescript
@Get()
getReport(): StreamableFile {
  const file = createReadStream(join(process.cwd(), 'report.pdf'));
  return new StreamableFile(file).setErrorHandler((err, res) => {
    if (res.headersSent) {
      res.end();
      return;
    }
    res.statusCode = 404;
    res.send('Report not found');
  });
}
```

The `setErrorLogger()` method replaces the function that logs errors emitted by the response stream while the file is being written to it.

> info **Note** The error handler and the error logger apply to the Express adapter. With the Fastify adapter, a stream error is handled by the [exceptions layer](/exception-filters), so by default the client receives a `500 Internal Server Error` response.

##### Cross-platform support

Fastify can send streams without `stream.pipe(res)`, so with Fastify the `StreamableFile` class is not strictly required. However, Nest supports `StreamableFile` on both platforms, so code that returns it works unchanged if you switch between Express and Fastify.
