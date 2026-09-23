### File upload and streaming

This chapter covers files in both directions: receiving files that clients upload, and [streaming files](#streaming-files) back to clients.

To handle file uploads, Nest provides a built-in module based on the [multer](https://github.com/expressjs/multer) middleware package for Express. Multer handles data posted in the `multipart/form-data` format, which is primarily used to upload files with an HTTP `POST` request. The module is fully configurable, so you can adjust its behavior to your application's requirements.

> warning **Warning** Multer cannot process data that is not in the `multipart/form-data` format.

> info **Hint** If your application runs on the `FastifyAdapter`, the same interceptors are available from the `@nestjs/platform-fastify` package, backed by [@fastify/multipart](https://github.com/fastify/fastify-multipart) instead of Multer, and the decorators and pipes described in this chapter work unchanged. Only the import path changes - see the [Fastify](/http/file-upload#fastify) section below.

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

#### Fastify

Starting with NestJS v12.1, applications running on the `FastifyAdapter` (see [Performance (Fastify)](/http/performance)) can handle file uploads with the same API, backed by the [@fastify/multipart](https://github.com/fastify/fastify-multipart) plugin instead of Multer. The interceptors described in this chapter take the same arguments and options, populate the request in the same way, and fail with the same error responses, while `@UploadedFile()`, `@UploadedFiles()`, `ParseFilePipe`, `ParseFilePipeBuilder` and the built-in file validators work unchanged.

First, install the plugin:

```bash
$ npm i @fastify/multipart
```

There is no need to register it: the `FastifyAdapter` registers the plugin automatically as soon as your application uses one of the upload interceptors (in applications that don't, it is not registered at all). If the package is not installed, the application fails to start with an error naming it.

Next, import the interceptors from `@nestjs/platform-fastify/multipart` instead of `@nestjs/platform-express`. The rest of the controller stays the same, except that files are typed as `UploadedMultipartFile`:

```typescript
import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  UploadedMultipartFile,
} from '@nestjs/platform-fastify/multipart';

@Controller('files')
export class FilesController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 }),
          new FileTypeValidator({ fileType: 'image/png' }),
        ],
      }),
    )
    file: UploadedMultipartFile,
  ) {
    console.log(file);
  }
}
```

> info **Hint** Everything exported from `@nestjs/platform-fastify/multipart` is also re-exported from the `@nestjs/platform-fastify` package root. The interceptors only work with the `FastifyAdapter`: with the `ExpressAdapter`, the application fails to start, so keep importing them from `@nestjs/platform-express` there.

The table below maps the Express API to its Fastify counterpart:

| `@nestjs/platform-express`                                                                                            | `@nestjs/platform-fastify/multipart`                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `FileInterceptor()`, `FilesInterceptor()`, `FileFieldsInterceptor()`, `AnyFilesInterceptor()`, `NoFilesInterceptor()` | Same names, arguments and options                                                              |
| `MulterOptions`                                                                                                       | `MultipartOptions`                                                                             |
| `MulterModule`, `MulterOptionsFactory`, `createMulterOptions()`                                                       | `MultipartModule`, `MultipartOptionsFactory`, `createMultipartOptions()`                       |
| `Express.Multer.File`                                                                                                 | `UploadedMultipartFile`                                                                        |
| `memoryStorage()` and `diskStorage()` from the `multer` package                                                       | `memoryStorage()` and `diskStorage()`                                                          |
| -                                                                                                                     | `FileStreamInterceptor()` (see [Streaming uploads](/http/file-upload#streaming-uploads)) |

The interceptor options are the ones Multer accepts: `dest`, `storage`, `limits` (an object, or a function that receives the request and returns one), `fileFilter`, `preservePath` and `defParamCharset`. Uploaded files are exposed as `req.file` or `req.files` and text fields as `req.body`, exactly as with Multer. `UploadedMultipartFile` has the same shape as `Express.Multer.File`, so you don't need the `@types/multer` package.

`MultipartModule` sets default options for the upload interceptors of the module that imports it, just like `MulterModule`. Its `registerAsync()` method accepts `useFactory` (with `imports` and `inject`), `useClass` and `useExisting`.

```typescript
MultipartModule.register({
  dest: './upload',
});
```

##### Storage

As with Multer, files are kept in memory (in `file.buffer`) unless you set the `dest` or `storage` option. `dest` writes each file to the given folder under a random name, and the `diskStorage()` function lets you choose the folder and the file name. Disk storage sets `destination`, `filename` and `path` on the file instead of `buffer`.

```typescript
import {
  diskStorage,
  FileInterceptor,
  UploadedMultipartFile,
} from '@nestjs/platform-fastify/multipart';

@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) =>
        callback(null, `${Date.now()}-${file.originalname}`),
    }),
  }),
)
uploadFile(@UploadedFile() file: UploadedMultipartFile) {
  console.log(file.path);
}
```

Storage engines follow Multer's storage engine contract (`_handleFile()` and `_removeFile()`), so Multer's own `multer.diskStorage()` and third-party Multer storage engines can be passed as `storage` unchanged.

##### Limits

`@fastify/multipart` applies stricter defaults than Multer. Unless configured otherwise, the maximum file size (`fileSize`) is the Fastify `bodyLimit` (1 MiB by default) and the maximum number of parts (`parts`) is 1000, whereas Multer limits neither. Larger files are rejected with a `413 File too large` response. You can raise these limits:

- for a single route, with the `limits` option of the interceptor
- for a module, with `MultipartModule.register()` or `registerAsync()`
- for the whole application, with the `multipart` option of the `FastifyAdapter`, which passes options to the plugin itself:

```typescript
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    multipart: { limits: { fileSize: 10 * 1024 * 1024 } },
  }),
);
```

Limits set on a route are merged over the ones set with `MultipartModule` key by key, and both are merged over the application-wide ones. The only exception is `fieldNameSize`, which the interceptors don't read from the plugin options - set it on the route or with `MultipartModule`.

##### Plugin registration

The `multipart` option of the `FastifyAdapter` controls how the `@fastify/multipart` plugin is registered:

- not set (default): the adapter registers the plugin when an upload interceptor is used, unless it has been registered already
- an options object (`FastifyMultipartOptions`, e.g., `limits`): the adapter registers the plugin with these options when the application initializes
- `true`: same as above, with the plugin's default options
- `false`: the adapter never registers the plugin, for applications that register it themselves or parse multipart requests with another library (the upload interceptors still require `@fastify/multipart`, and the application fails to start if it is not registered)

Set the option to `true` (or pass an options object) when an upload interceptor is instantiated outside the dependency injection system, for example `new (FileInterceptor('file'))()` passed to `app.useGlobalInterceptors()`, as it doesn't trigger the automatic registration. The same applies when upload interceptors are only used in [lazy-loaded modules](/fundamentals/lazy-loading-modules) that are loaded after the application has started, since plugins can no longer be registered at that point.

If you prefer to register the plugin yourself, pass it to `app.register()`, either before or after `app.init()`. The adapter takes this registration over, so the plugin is registered only once, and your options take precedence over the ones passed through the `multipart` option:

```typescript
import multipart from '@fastify/multipart';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);
await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
```

> warning **Warning** Registering `@fastify/multipart` directly on the Fastify instance (`app.getHttpAdapter().getInstance().register(multipart)`), or passing a dynamic `import()` of it to `app.register()`, only works before `app.init()` (which `app.listen()` calls for you). After that, the adapter has already registered the plugin for your upload interceptors, and Fastify fails with an `FST_ERR_DEC_ALREADY_PRESENT` error. Use `app.register(multipart)` or the `multipart` option instead, or set the option to `false` to manage the plugin yourself.

##### Streaming uploads

The interceptors described so far store every file (in memory or on disk) before the route handler runs. To process a file as it arrives instead, for example to pipe a large upload to its final destination, use `FileStreamInterceptor()`, which is available on Fastify only. It takes the name of the field that holds the file and an optional options object (the same as for the other interceptors, except `dest` and `storage`), and hands the route handler a file with a `stream` property in place of `buffer`:

```typescript
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import {
  FileStreamInterceptor,
  MultipartFileStream,
} from '@nestjs/platform-fastify/multipart';

@Post('upload')
@UseInterceptors(
  FileStreamInterceptor('file', { limits: { fileSize: 1024 * 1024 * 1024 } }),
)
async uploadFile(@UploadedFile() file: MultipartFileStream, @Body() body) {
  const path = join('uploads', randomUUID());
  await pipeline(file.stream, createWriteStream(path));
  return { originalname: file.originalname, path, body };
}
```

Since the file is never buffered, a few rules apply:

- Text fields must precede the file in the form. The ones sent before it are available in `req.body` (`@Body()`), while the parts that follow the file are not parsed.
- Only one file is accepted, in the given field. A file in any other field fails the request with a `400 Unexpected file field` response.
- The file size is not known up front, so `MaxFileSizeValidator` doesn't apply, and neither does the magic number check of `FileTypeValidator` (set its `skipMagicNumbersValidation` option to `true` to compare the client-provided mime type only). The `fileSize` limit is still enforced: once it is exceeded, the stream errors with a `PayloadTooLargeException`.
- Whatever the route handler leaves unread is discarded before the response is sent, so that the client can finish uploading. When the handler returns a `StreamableFile` (which may be the upload itself), the rest of the upload is discarded once the response has been sent instead. For this reason, a handler that responds with a `StreamableFile` of something other than the upload should read the upload first - otherwise, a client that is still uploading over a connection that is not kept alive may fail with an `EPIPE` or `ECONNRESET` error.

##### Differences from Multer

Besides the [default limits](/http/file-upload#limits), the Fastify interceptors differ from Multer in the following ways:

- A text field of exactly `fieldSize` bytes is accepted, while Multer rejects it.
- Field names that could pollute a prototype (`constructor`, or names with a `__proto__`, `constructor` or `prototype` segment, such as `user[constructor]`) fail the request with a `400 Invalid field name` response. Multer accepts them.
- Text fields sent with a `Content-Type: application/json` header arrive parsed, and invalid JSON fails the request with a `400` response (a `@fastify/multipart` feature). Malformed part header lines are ignored, whereas Multer fails the request with a `400` response.
- `fileFilter` functions and storage engines receive the Fastify request instead of the Express one.
- The `attachFieldsToBody` plugin option is not supported, as it consumes the request body before the interceptors run.
- Multer's `fieldNestingDepth` and `fieldArrayIndexLimit` limits and its `highWaterMark`, `fileHwm`, `defCharset` and `streamHandler` options are not supported by the interceptors.

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
