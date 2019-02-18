### File upload

In order to handle file uploading, Nest makes use of [multer](https://github.com/expressjs/multer) middleware. This middleware is fully configurable and you can adjust its behavior to your application requirements.

Multer is middleware for handling `multipart/form-data`, which is primarily used for uploading files.

> warning **Warning** Multer will not process any form which is not multipart (`multipart/form-data`). Besides, this package won't work with the `FastifyAdapter`.

#### Basic example

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

> info **Hint** Both `FileInterceptor()` and `@UploadedFile()` decorator are exposed from `@nestjs/common` package.

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

> info **Hint** Both `FilesInterceptor()` and `@UploadedFiles()` decorator are exposed from `@nestjs/common` package.

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

To customize [multer](https://github.com/expressjs/multer) behavior, you can register the `MulterModule`. We support all options listed [here](https://github.com/expressjs/multer#multeropts).

```typescript
MulterModule.register({
  dest: '/upload',
});
```

#### Async configuration

Quite often you might want to asynchronously pass your module options instead of passing them beforehand. In such case, use `registerAsync()` method, that provides a couple of various ways to deal with async data.

First possible approach is to use a factory function:

```typescript
MulterModule.registerAsync({
  useFactory: () => ({
    dest: '/upload',
  }),
});
```

Obviously, our factory behaves like every other one (might be `async` and is able to inject dependencies through `inject`).

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.getString('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you are able to use class instead of a factory.

```typescript
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
```

Above construction will instantiate `MulterConfigService` inside `MulterModule` and will leverage it to create options object. The `MulterConfigService` has to implement `MulterOptionsFactory` interface.

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: '/upload',
    };
  }
}
```

In order to prevent the creation of `MulterConfigService` inside `MulterModule` and use a provider imported from a different module, you can use the `useExisting` syntax.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

It works the same as `useClass` with one critical difference - `MulterModule` will lookup imported modules to reuse already created `ConfigService`, instead of instantiating it on its own.
