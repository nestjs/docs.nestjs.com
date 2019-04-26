### File upload

In order to handle file uploading, Nest provides a dedicated `@nestjs/multer` package to work with it. Multer is a package for handling `multipart/form-data`, which is primarily used for uploading files.

This module is fully configurable and you can adjust its behavior to your application requirements.

> warning **Warning** Multer will not process any form which is not multipart (`multipart/form-data`).

#### Basic example

Firstly, we need to provide a proper multer adapter into the root `ApplicationModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MULTER_MODULE_ADAPTER } from '@nestjs/multer';
import { multerAdapter } from '@nestjs/platform-express'; // or '@nestjs/platform-fastify'

@Module({
  // ...
  providers: [
    // ... other providers,
    {
      provide: MULTER_MODULE_ADAPTER,
      useValue: multerAdapter,
    },
  ],
})
export class ApplicationModule {}
```

> info **Notice** If you use `FastifyAdapter`, you also need to register the `fastify-multipart` plugin like this `app.register(require('fastify-multipart'));`

When we want to upload a single file, we simply tie `FileInterceptor()` to the handler, and then, pull outs `file` from the `request` using `@UploadedFile()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file) {
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

> info **Hint** `FileInterceptor()` decorator is exported from `@nestjs/multer` package while `@UploadedFile()` from `@nestjs/common`.

The `FileInterceptor()` takes two arguments, a `fieldName` (points to field from HTML form that holds a file) and optional `options` object. These `MulterOptions` are equivalent to those passed into multer constructor (more details [here](https://github.com/expressjs/multer#multeropts))

#### Array of files

In order to upload an array of files, we use `FilesInterceptor()`. This interceptor takes three arguments. A `fieldName` (that remains the same), `maxCount` which is a maximum number of files that can be uploaded at the same time, and optional `MulterOptions` object. Additionally, to pick files from `request` object, we use `@UploadedFiles()` decorator

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files) {
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

> info **Hint** `FilesInterceptor()` decorator is exported from `@nestjs/multer` package while `@UploadedFiles()` from `@nestjs/common`.

#### Multiple files

To upload multiple fields (all with different keys), we use `FileFieldsInterceptor()` decorator.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files) {
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

#### Default options

To customize [multer](https://github.com/nestjs/multer) behavior, you can register the `MulterModule`. We support all options listed [here](https://github.com/expressjs/multer#multeropts).

```typescript
MulterModule.register(
  {
    dest: '/upload'
  },
  multerAdapter
);
```

#### Async configuration

Quite often you might want to asynchronously pass your module options instead of passing them beforehand. In such case, use `registerAsync()` method, that provides a couple of various ways to deal with async data.

First possible approach is to use a factory function:

```typescript
MulterModule.registerAsync(
  {
    useFactory: () => ({
      dest: '/upload'
    })
  },
  multerAdapter
);
```

Obviously, our factory behaves like every other one (might be `async` and is able to inject dependencies through `inject`).

```typescript
MulterModule.registerAsync(
  {
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      dest: configService.getString('MULTER_DEST')
    }),
    inject: [ConfigService]
  },
  multerAdapter
);
```

Alternatively, you are able to use class instead of a factory.

```typescript
MulterModule.registerAsync(
  {
    useClass: MulterConfigService
  },
  multerAdapter
);
```

Above construction will instantiate `MulterConfigService` inside `MulterModule` and will leverage it to create options object. The `MulterConfigService` has to implement `MulterOptionsFactory` interface.

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: '/upload'
    };
  }
}
```

In order to prevent the creation of `MulterConfigService` inside `MulterModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
MulterModule.registerAsync(
  {
    imports: [ConfigModule],
    useExisting: ConfigService
  },
  multerAdapter
);
```

It works the same as `useClass` with one critical difference - `MulterModule` will lookup imported modules to reuse already created `ConfigService`, instead of instantiating it on its own.

> info **Hint** In the previous examples we configure the multer adapter with the second parameter in the `register` or `registerAsync` method instead use the `providers` array like we did it in the first example.
