### File storage

An online store for cat food and supplies keeps three kinds of files. Product photos are uploaded by staff and shown to everyone. Invoices are PDF files that only the customer who paid should be able to download. And the warehouse team photographs products with the store's mobile app, which uploads large photos that shouldn't have to pass through the order API.

In development, all of this should work from a folder on the laptop. In production, the files go to S3 or Cloudflare R2, because the API runs on several instances and none of them has a disk that lasts. The code that stores and serves files should be the same in both.

`@nestjs/storage` gives each place files live a name, a **disk**, and one API for all of them: `put()`, `get()`, `list()`, `delete()`, public URLs and signed URLs. It ships a local disk, an S3 disk that works with AWS S3 and S3-compatible stores (Cloudflare R2, MinIO, Backblaze B2), and an in-memory disk for tests. It talks to S3 over `fetch`, with no AWS SDK, and depends only on `@nestjs/common` and `@nestjs/core`.

It doesn't parse uploads. multer on Express and `@nestjs/platform-fastify/multipart` on Fastify keep doing that, with `FileInterceptor()` as usual. This package is where the files end up: it provides a storage engine that streams each upload straight onto a disk.

In this tutorial, you'll:

- configure a public disk for photos and a private disk for everything else,
- stream photo uploads onto the photos disk, with the type and size checked before anything is written,
- store invoices privately and hand out download links that expire after five minutes,
- let the mobile app upload photos directly to storage, with a signed upload URL,
- switch from local disks to S3 or R2 with configuration alone,
- test all of it against in-memory disks.

#### Installation

To get started, install the required dependencies:

```bash
$ npm i --save @nestjs/storage @nestjs/config
```

#### Configure the disks

The app needs two disks. `photos` holds product photos, which anyone may see, so it has a public URL. `private` holds invoices and uploads that haven't been checked yet, and is only reachable through signed URLs. Keeping public and private files on separate disks (separate buckets, in production) means a file never becomes public by accident.

Start with the configuration, a [custom configuration file](/application/configuration#custom-configuration-files) for `@nestjs/config`. `STORAGE_DRIVER` will pick local disks or S3 [in production](/application/file-storage#use-s3-or-r2-in-production); until then, everything is local:

```typescript
@@filename(config/configuration)
export default () => ({
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  storage: {
    // 'local' in development, 's3' in production (AWS S3, Cloudflare R2, MinIO...)
    driver: process.env.STORAGE_DRIVER ?? 'local',
    root: process.env.STORAGE_ROOT ?? 'storage',
    signingKey: process.env.STORAGE_SIGNING_KEY,
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'auto',
      photosBucket: process.env.S3_PHOTOS_BUCKET ?? 'store-photos',
      privateBucket: process.env.S3_PRIVATE_BUCKET ?? 'store-private',
      photosUrl: process.env.PHOTOS_CDN_URL,
    },
  },
});
```

The disks are built from that configuration by a factory function:

```typescript
@@filename(storage/storage.config)
import { ConfigService } from '@nestjs/config';
import { LocalDisk, type StorageModuleOptions } from '@nestjs/storage';

export function createStorageOptions(config: ConfigService): StorageModuleOptions {
  const appUrl = config.getOrThrow<string>('appUrl');
  const root = config.getOrThrow<string>('storage.root');
  return {
    default: 'private',
    disks: {
      // Product photos: public, served by the app in development
      photos: new LocalDisk({ root: `${root}/photos`, publicUrl: `${appUrl}/photos` }),
      // Invoices and uploads in progress: only reachable through signed URLs
      private: new LocalDisk({
        root: `${root}/private`,
        signedUrls: {
          baseUrl: `${appUrl}/files`,
          keys: [config.getOrThrow<string>('storage.signingKey')],
        },
      }),
    },
  };
}
```

A `LocalDisk` keeps files in a directory, which it creates at startup. `publicUrl` is where the files can be fetched publicly: the photos disk's `url(key)` returns URLs under it. In development, the app itself will serve that path (see [Upload product photos](/application/file-storage#upload-product-photos)); in production, a CDN will.

A local directory can't produce signed URLs the way S3 does, so the private disk signs its own: with `signedUrls`, its `signedUrl()` returns URLs under `baseUrl`, signed with HMAC-SHA256, which the app verifies and serves (see [Serve signed URLs in development](/application/file-storage#serve-signed-urls-in-development)). `keys` takes one or more keys. The first signs, and all of them verify, so you can rotate a key by putting the new one first and removing the old one once the links it signed have expired. A key must have at least 32 characters.

Register the module with `forRootAsync()`, so the factory can read `ConfigService`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '@nestjs/storage';
import configuration from './config/configuration.js';
import { createStorageOptions } from './storage/storage.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    StorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createStorageOptions,
    }),
  ],
})
export class AppModule {}
```

`StorageModule` is global. Services inject a disk in one of three ways:

| Injection | Gives you |
| --- | --- |
| `private readonly files: StorageDisk` | The default disk, here `private` |
| `@InjectDisk('photos') private readonly photos: StorageDisk` | The disk called `photos` |
| `private readonly storage: Storage` | Every disk: `storage.disk('photos')`, for code that picks a disk at runtime |

Configuration mistakes stop the application at startup. Without `STORAGE_SIGNING_KEY`, `getOrThrow()` reports the missing key; with a short one, the error says the signing key must have at least 32 characters. The same goes for a `default` that names no disk, and for a class that injects a disk name no configuration provides:

```text
PhotosService injects the disk "photos" (@InjectDisk('photos')), but StorageModule has no disk by that name. Configured disks: private.
```

#### Upload product photos

Photos may be JPEG, PNG or WebP images of up to 5 MiB. The rules are shared by the upload endpoint below and the [mobile uploads](/application/file-storage#upload-straight-to-storage-from-the-mobile-app) further down:

```typescript
@@filename(products/photo-rules)
/** What a product photo may be, wherever it is uploaded from. */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MiB
/** Every photo gets a new key, so browsers and the CDN may cache it forever. */
export const PHOTO_CACHE_CONTROL = 'public, max-age=31536000, immutable';
```

The upload endpoint uses `FileInterceptor()` from `@nestjs/platform-express`, as any upload does. The difference is the `storage` option: `uploadToDisk()` is a multer storage engine that streams the file onto a disk instead of into memory or a temp folder:

```typescript
@@filename(products/photos.controller)
import { BadRequestException, Controller, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectDisk, serveFile, StorageDisk, uploadToDisk, type StoredUpload } from '@nestjs/storage';
import type { Request, Response } from 'express';
import { MAX_PHOTO_SIZE, PHOTO_CACHE_CONTROL, PHOTO_TYPES } from './photo-rules.js';
import { PhotosService } from './photos.service.js';

@Controller()
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
    @InjectDisk('photos') private readonly photos: StorageDisk,
  ) {}

  @Post('products/:id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: uploadToDisk({ disk: 'photos', contentTypes: PHOTO_TYPES, cacheControl: PHOTO_CACHE_CONTROL }),
      limits: { fileSize: MAX_PHOTO_SIZE, files: 1 },
    }),
  )
  upload(@Param('id') id: string, @UploadedFile() file: StoredUpload | undefined) {
    if (!file) throw new BadRequestException('Attach the image as the "photo" field');
    return this.photosService.replace(id, file.key);
  }

  // Development only: in production a CDN serves the photos bucket at `publicUrl`
  @Get('photos/:file')
  serve(@Param('file') file: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return serveFile(this.photos, file, { req, res, disposition: 'inline' });
  }
}
```

By the time the handler runs, the photo is stored. `uploadToDisk()` has done three things on the way:

- **It checked what the file is, not what the client says it is.** A browser sends the type it guesses from the file name, and a script can send anything, so a file declared `image/png` may well be an HTML page or an SVG with a script in it. The engine reads the first bytes of the stream, detects the type from them, and refuses anything not in `contentTypes` with a `415` before a byte is written. The stored content type is the detected one, never the client's.
- **It enforced the size limit without leaving a partial file.** multer stops reading at `limits.fileSize`. The engine then refuses to commit what it received: the request fails with `413 File too large`, nothing is stored, and no file is replaced.
- **It picked the key.** By default, a random UUID and the extension of the detected type, such as `2f1c0d6e-….png`. Unique keys matter: an upload never overwrites another, and a cached photo never goes stale.

`@UploadedFile()` returns a `StoredUpload`: multer's usual fields (`fieldname`, `originalname`, `mimetype`, `size`) plus `key`, `disk`, `contentType` and `etag`. `mimetype` is still the client's claim; use `contentType`.

> info **Hint** `ParseFilePipe` and its validators run after the interceptor, when a streamed file is already stored, and `FileTypeValidator` needs the file in memory to check its bytes. With `uploadToDisk()`, check type and size in the engine, as above. On Fastify, import `FileInterceptor` from `@nestjs/platform-fastify/multipart` and register `@fastify/multipart`; `uploadToDisk()` works the same with both.

Products have this shape, and the application's `ProductsService` has `findOne(id)`, which throws `NotFoundException` for an unknown id, and `setPhoto(id, key)`:

```typescript
@@filename(products/product)
export interface Product {
  id: string;
  name: string;
  /** Price in cents */
  price: number;
  /** Where the photo lives on the `photos` disk */
  photoKey?: string;
}
```

The service records the new photo, and deletes the previous one:

```typescript
@@filename(products/photos.service)
import { Injectable } from '@nestjs/common';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import { ProductsService } from './products.service.js';

@Injectable()
export class PhotosService {
  constructor(
    private readonly productsService: ProductsService,
    @InjectDisk('photos') private readonly photos: StorageDisk,
  ) {}

  async replace(productId: string, key: string) {
    let previous: string | undefined;
    try {
      previous = this.productsService.findOne(productId).photoKey;
      this.productsService.setPhoto(productId, key);
    } catch (error) {
      // The upload is already stored: don't leave it behind for a product that doesn't exist
      await this.photos.delete(key);
      throw error;
    }
    if (previous) await this.photos.delete(previous);
    return { id: productId, photoUrl: this.photos.url(key) };
  }
}
```

The interceptor runs before the handler, so the file is stored even when the product turns out not to exist. The service deletes it in that case, which keeps a mistyped id from leaving orphans behind. `url(key)` builds the public URL from the disk's `publicUrl`.

The `GET photos/:file` route serves photos in development. `serveFile()` streams a file from a disk as the response, with `Content-Type`, `Content-Length`, `ETag`, `Last-Modified`, the `Cache-Control` stored with the file (`private` when none is, so a shared cache never keeps a file that may be one user's), and `X-Content-Type-Options: nosniff`, so the browser never second-guesses the type. `disposition: 'inline'` lets the browser show the image; for types that could run script in your origin, such as HTML or SVG, `serveFile()` sends `Content-Disposition: attachment` regardless. It answers `Range` requests with `206`, `If-None-Match` with `304`, and a missing file with `404`.

Register the feature module, and import `ProductsModule` in `AppModule`:

```typescript
@@filename(products/products.module)
import { Module } from '@nestjs/common';
import { PhotosController } from './photos.controller.js';
import { PhotosService } from './photos.service.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [PhotosController],
  providers: [ProductsService, PhotosService],
})
export class ProductsModule {}
```

#### Keep invoices private

An invoice is generated the first time a customer asks for it and stored on the private disk. A real app renders the PDF with a library or a rendering service; this stand-in is enough to follow the flow:

```typescript
@@filename(invoices/render-invoice)
import type { Order } from '../orders/order.interface.js';

const usd = (cents: number) => (cents / 100).toFixed(2);

/** A stand-in for a real PDF renderer (pdfkit, a headless browser, a rendering service). */
export function renderInvoice(order: Order): Buffer {
  const lines = order.items.map((item) => `% ${item.quantity} x ${item.name}  ${usd(item.price)}`);
  return Buffer.from(
    ['%PDF-1.7', `% Invoice for ${order.id}`, ...lines, `% Total ${usd(order.total)} USD`, '%%EOF', ''].join('\n'),
  );
}
```

The service reads the order with the application's `OrdersService`, in which order `ord_1000` has been paid and `ord_1001` hasn't, stores the invoice once, and returns a signed link to it:

```typescript
@@filename(invoices/invoices.service)
import { ConflictException, Injectable } from '@nestjs/common';
import { StorageDisk } from '@nestjs/storage';
import { OrdersService } from '../orders/orders.service.js';
import { renderInvoice } from './render-invoice.js';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly ordersService: OrdersService,
    // No name: the default disk, `private`
    private readonly storageDisk: StorageDisk,
  ) {}

  async downloadUrl(orderId: string) {
    const order = this.ordersService.findOne(orderId);
    if (order.status === 'pending') {
      throw new ConflictException(`Order ${orderId} has not been paid yet`);
    }
    const key = `invoices/${order.id}.pdf`;
    if (!(await this.storageDisk.exists(key))) {
      await this.storageDisk.put(key, renderInvoice(order), {
        contentType: 'application/pdf',
        metadata: { orderId: order.id },
      });
    }
    const url = await this.storageDisk.signedUrl(key, {
      expiresIn: '5m',
      filename: `invoice-${order.id}.pdf`,
    });
    return { url };
  }
}
```

`put()` takes a `Buffer`, a string, a `Uint8Array`, a Node stream, a web `ReadableStream`, or any async iterable of bytes. On every disk, a write is atomic: a reader sees the old file or the new one, never half of one, and a write that fails leaves nothing behind. `metadata` stores your own string values with the file; `stat()` and `get()` return them.

`signedUrl()` returns a link that works without any other credentials until it expires. `expiresIn` is a duration: `'5m'`, `'1h'`, or milliseconds, 15 minutes by default and at most 7 days, S3's limit. `filename` sets the name the browser saves the file under.

The endpoint returns the link rather than the file, which lets a web page or the mobile app open it directly:

```typescript
@@filename(orders/orders.controller)
import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from '../invoices/invoices.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get(':id/invoice')
  invoice(@Param('id') id: string) {
    return this.invoicesService.downloadUrl(id);
  }
}
```

Register `OrdersController`, `OrdersService` and `InvoicesService` in an `OrdersModule`. In a real app, the endpoint also checks that the invoice belongs to the signed-in customer, for instance with a policy from the [authorization](/security/authorization) tutorial. The link itself needs no check: whoever holds it may download that one file until it expires.

#### Serve signed URLs in development

With a local disk, the signed link points at the app itself, `http://localhost:3000/files?key=…&expires=…&signature=…`, so the app needs a route that verifies and serves it:

```typescript
@@filename(files/files.controller)
import { Controller, Get, Req, Res } from '@nestjs/common';
import { serveSignedUrl, StorageDisk } from '@nestjs/storage';
import type { Request, Response } from 'express';

/**
 * Serves the private disk's signed URLs when it is a local disk. With S3, the URLs point at
 * the bucket and this route answers 404.
 */
@Controller('files')
export class FilesController {
  constructor(private readonly storageDisk: StorageDisk) {}

  @Get()
  download(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return serveSignedUrl(this.storageDisk, { req, res });
  }
}
```

`serveSignedUrl()` checks the signature, the expiry and the method, then answers like `serveFile()`, with the file name the link was signed with. The signature covers the route (`baseUrl`), the key, the expiry and the file name, so changing any of them is a `403 Invalid signed URL`, a link past its expiry is a `403 The signed URL has expired`, and a link issued for one disk's route is refused by another's, even when both use the same signing key. Download managers can resume a large file with `Range` requests.

Register the controller in a `FilesModule`, and import it in `AppModule` along with the other features:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '@nestjs/storage';
import configuration from './config/configuration.js';
import { FilesModule } from './files/files.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { ProductsModule } from './products/products.module.js';
import { createStorageOptions } from './storage/storage.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    StorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createStorageOptions,
    }),
    ProductsModule,
    OrdersModule,
    FilesModule,
  ],
})
export class AppModule {}
```

The route stays in the app in production. There, the private disk is an S3 disk whose signed URLs point at the bucket, so `serveSignedUrl()` has nothing to serve and answers `404`.

#### Upload straight to storage from the mobile app

The warehouse team photographs products with the mobile app. Photos are large, and phones are often on slow connections, so an upload through the API would hold a connection and a request for as long as it takes. Instead, the app asks the API for an upload URL, sends the photo straight to storage, and then tells the API it is done:

1. `POST /products/:id/photo/uploads` with the photo's type and size returns a signed upload URL.
2. The app sends the photo to that URL with `PUT`.
3. `PUT /products/:id/photo` with the upload's key makes it the product's photo.

The upload goes to the private disk, under `incoming/`, because the API hasn't looked at it yet. Only after checking it does the API copy it to the photos disk:

```typescript
@@filename(products/photos.service)
@Injectable()
export class PhotosService {
  constructor(
    private readonly productsService: ProductsService,
    @InjectDisk('photos') private readonly photos: StorageDisk,
    @InjectDisk('private') private readonly uploads: StorageDisk,
  ) {}

  // ...

  async createUpload(productId: string, contentType: string, size: number) {
    this.productsService.findOne(productId);
    if (!PHOTO_TYPES.includes(contentType)) {
      throw new UnsupportedMediaTypeException(`A photo must be one of: ${PHOTO_TYPES.join(', ')}`);
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_PHOTO_SIZE) {
      throw new BadRequestException(`size must be between 1 and ${MAX_PHOTO_SIZE} bytes`);
    }
    // Private until checked; the product id in the key ties the upload to this product
    const key = `incoming/${productId}/${randomUUID()}`;
    const upload = await this.uploads.signedUpload(key, { contentType, contentLength: size, expiresIn: '10m' });
    return { key, ...upload };
  }

  async completeUpload(productId: string, key: string) {
    this.productsService.findOne(productId);
    // Only keys this endpoint handed out for this product: never copy an arbitrary private
    // file (an invoice) to the public photos disk.
    const prefix = `incoming/${productId}/`;
    if (typeof key !== 'string' || !key.startsWith(prefix) || !/^[0-9a-f-]{36}$/.test(key.slice(prefix.length))) {
      throw new BadRequestException('Unknown upload');
    }
    const file = await this.uploads.stat(key).catch((error: unknown) => {
      if (error instanceof StorageFileNotFoundError) throw new BadRequestException('Upload the file first');
      throw error;
    });
    if (file.size > MAX_PHOTO_SIZE) {
      await this.uploads.delete(key);
      throw new PayloadTooLargeException('File too large');
    }
    // The client chose the Content-Type: check what the bytes are
    const head = await this.uploads.get(key, { range: { start: 0, end: 15 } });
    const type = detectContentType(await buffer(head.body));
    if (!type || !PHOTO_TYPES.includes(type)) {
      await this.uploads.delete(key);
      throw new UnsupportedMediaTypeException(`A photo must be one of: ${PHOTO_TYPES.join(', ')}`);
    }
    // Stream it from the private disk to the public one
    const photoKey = `${randomUUID()}${EXTENSIONS[type]}`;
    const { body } = await this.uploads.get(key);
    await this.photos.put(photoKey, body, {
      contentType: type,
      contentLength: file.size,
      cacheControl: PHOTO_CACHE_CONTROL,
    });
    await this.uploads.delete(key);
    return this.replace(productId, photoKey);
  }
}
```

`signedUpload()` returns the URL, the method (`PUT`), the headers the client must send, and when the URL expires. The URL is signed for exactly the declared content type and size: a different `Content-Type`, or a body of another length, is refused by the storage (`403`), so the app can't send a 2 GB video where it announced a 2 MB photo.

The declared type is still the client's claim. `completeUpload()` therefore treats the upload as untrusted:

- **The key must be one it handed out for this product.** Without that check, a client could submit `invoices/ord_1000.pdf` and have the API copy someone's invoice to the public photos disk.
- **The size is checked again** with `stat()`, which returns the file's metadata without its body.
- **The bytes are checked** by reading only the first 16, with a ranged `get()`, and passing them to `detectContentType()`, which recognizes JPEG, PNG, GIF, WebP, AVIF, HEIC and PDF.

Only then is the photo streamed from one disk to the other: `get()` returns the body as a Node stream, and `put()` accepts it, so the file never sits in memory whole. On S3, that is a download and an upload through the API instance, which is fine for photos; for very large files, you would process them where they are, for instance with a job.

The two routes in the controller pass the request on:

```typescript
@@filename(products/photos.controller)
// The mobile app asks for an upload URL, sends the photo there, then submits its key
@Post('products/:id/photo/uploads')
createUpload(@Param('id') id: string, @Body() body: { contentType: string; size: number }) {
  return this.photosService.createUpload(id, body.contentType, body.size);
}

@Put('products/:id/photo')
completeUpload(@Param('id') id: string, @Body('key') key: string) {
  return this.photosService.completeUpload(id, key);
}
```

With a local disk, the upload URL points at the app again, so `FilesController` receives the `PUT` too. `receiveSignedUpload()` does what S3 does with a presigned URL: it checks the signature, the expiry, the content type and the length, and streams the body onto the disk:

```typescript
@@filename(files/files.controller)
import { Controller, Get, Put, Req, Res } from '@nestjs/common';
import { receiveSignedUpload, serveSignedUrl, StorageDisk } from '@nestjs/storage';
import type { Request, Response } from 'express';

/**
 * Serves the private disk's signed URLs when it is a local disk. With S3, the URLs point at
 * the bucket and this route answers 404.
 */
@Controller('files')
export class FilesController {
  constructor(private readonly storageDisk: StorageDisk) {}

  @Get()
  download(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return serveSignedUrl(this.storageDisk, { req, res });
  }

  @Put()
  upload(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return receiveSignedUpload(this.storageDisk, { req, res });
  }
}
```

> info **Hint** On Fastify, the upload's body must reach the handler unread. Fastify only parses JSON and plain text by default and answers other content types with `415`, so register a catch-all parser that leaves the body alone: `app.getHttpAdapter().getInstance().addContentTypeParser('*', (req, payload, done) => done(null))`.

Uploads that are never completed stay under `incoming/`. On S3, a lifecycle rule deletes them after a day (see the production checklist).

#### Use S3 or R2 in production

In production, both disks become S3 disks. A local disk can't serve there: a container's file system is discarded when the task is replaced (a deploy, a scale-in, a failed node), taking the files with it, and other instances can't read them. Only the factory changes; every service, controller and signed URL keeps working:

```typescript
@@filename(storage/storage.config)
import { ConfigService } from '@nestjs/config';
import { LocalDisk, S3Disk, type StorageModuleOptions } from '@nestjs/storage';

export function createStorageOptions(config: ConfigService): StorageModuleOptions {
  if (config.get('storage.driver') === 's3') {
    const s3 = {
      endpoint: config.get<string>('storage.s3.endpoint'),
      region: config.getOrThrow<string>('storage.s3.region'),
    };
    return {
      default: 'private',
      disks: {
        photos: new S3Disk({
          ...s3,
          bucket: config.getOrThrow<string>('storage.s3.photosBucket'),
          publicUrl: config.getOrThrow<string>('storage.s3.photosUrl'),
        }),
        private: new S3Disk({
          ...s3,
          bucket: config.getOrThrow<string>('storage.s3.privateBucket'),
        }),
      },
    };
  }

  // ... the local disks from before
}
```

`S3Disk` reads credentials from the standard `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN` variables, unless you pass `credentials`, either an object or a function that returns them (called before every request, for credentials that rotate). Without credentials, the app doesn't start. The same class covers several services:

| Service | Settings |
| --- | --- |
| AWS S3 | `region`, such as `eu-central-1`. No `endpoint` |
| Cloudflare R2 | `endpoint: 'https://<account id>.r2.cloudflarestorage.com'`, `region: 'auto'` |
| MinIO | `endpoint: 'http://minio:9000'`, `forcePathStyle: true` |
| Backblaze B2 | `endpoint: 'https://s3.<region>.backblazeb2.com'`, `region` |
| Google Cloud Storage | `endpoint: 'https://storage.googleapis.com'`, HMAC keys as credentials, `batchDelete: false` |

With S3, `signedUrl()` and `signedUpload()` return presigned URLs, signed with the credentials, which the bucket verifies itself: the app's `/files` route isn't involved. `url()` returns URLs under `publicUrl`, typically a CDN or R2's public bucket domain in front of the photos bucket.

Uploads stream to S3 too. A file up to 8 MiB goes up in one request; a longer one, or a stream whose length isn't known, goes up as a multipart upload, four 8 MiB parts at a time, and is aborted if anything fails, so a failed upload never becomes a file. Requests that fail with a network error, a timeout, throttling (`429`, `SlowDown`) or a `5xx` are retried with backoff, up to 3 attempts in all. `multipart`, `retry` and `timeout` tune this per disk.

> info **Hint** Every S3 request is signed with Signature Version 4, implemented on `node:crypto`. It is checked against the AWS Signature Version 4 test suite and the examples in the Amazon S3 API reference, so there is no AWS SDK to install.

#### Try it

Start the app with a signing key, in a directory with a `kibble.png`, a `scratching-post.jpg` and a `notes.txt`:

```bash
$ export STORAGE_SIGNING_KEY=$(openssl rand -hex 32)
$ npm run start
```

Upload a photo. Then try a text file declared as an image, which the app refuses without storing it:

```bash
$ curl -F photo=@kibble.png localhost:3000/products/salmon-kibble-2kg/photo
{"id":"salmon-kibble-2kg","photoUrl":"http://localhost:3000/photos/b098be38-74b4-427a-8239-0ab3dc3a31d2.png"}

$ curl -F 'photo=@notes.txt;type=image/png' localhost:3000/products/salmon-kibble-2kg/photo
{"message":"File type not allowed. Allowed types: image/jpeg, image/png, image/webp","error":"Unsupported Media Type","statusCode":415}
```

Fetch a photo's headers:

```bash
$ PHOTO=$(curl -s -F photo=@kibble.png localhost:3000/products/salmon-kibble-2kg/photo | jq -r .photoUrl)
$ curl -sI "$PHOTO" | grep -iE '^(content-|cache-control|x-content)'
X-Content-Type-Options: nosniff
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/png
Content-Disposition: inline; filename="fc54756b-b451-41a8-82c9-2b979f99849a.png"
Content-Length: 70
```

Get a signed link to an invoice, download it, and try the same link for another order:

```bash
$ curl localhost:3000/orders/ord_1000/invoice
{"url":"http://localhost:3000/files?key=invoices%2Ford_1000.pdf&expires=1790319338&disposition=attachment%3B+filename%3D%22invoice-ord_1000.pdf%22&signature=w1O_KuRThM1epUeyqpsbXNGfECkQ9605tZzNjVFMsy8"}

$ INVOICE=$(curl -s localhost:3000/orders/ord_1000/invoice | jq -r .url)
$ curl -sOJ "$INVOICE"
$ head -c 8 invoice-ord_1000.pdf
%PDF-1.7

$ curl "${INVOICE/ord_1000/ord_1001}"
{"message":"Invalid signed URL","error":"Forbidden","statusCode":403}
```

Finally, upload a photo the way the mobile app does. Ask for an upload URL, send the file there, and submit its key:

```bash
$ curl -s localhost:3000/products/sisal-scratching-post/photo/uploads --json "{\"contentType\":\"image/jpeg\",\"size\":$(wc -c < scratching-post.jpg)}" | tee upload.json | jq
{
  "key": "incoming/sisal-scratching-post/7fe80da3-4710-4940-a904-4a1756280440",
  "url": "http://localhost:3000/files?key=incoming%2Fsisal-scratching-post%2F7fe80da3-4710-4940-a904-4a1756280440&expires=1790319638&method=PUT&type=image%2Fjpeg&length=2011&signature=vx-LwzqLUUeTQevHKTDjguRTM3c_FWOjCbik1Uo6Ojg",
  "method": "PUT",
  "headers": {
    "content-type": "image/jpeg"
  },
  "expiresAt": "2026-09-25T07:00:38.736Z"
}

$ curl -T scratching-post.jpg -H 'content-type: image/jpeg' "$(jq -r .url upload.json)"
{"key":"incoming/sisal-scratching-post/7fe80da3-4710-4940-a904-4a1756280440","size":2011,"contentType":"image/jpeg","etag":"\"7db-65c4922577c58\""}

$ curl -X PUT localhost:3000/products/sisal-scratching-post/photo --json "$(jq -c '{key}' upload.json)"
{"id":"sisal-scratching-post","photoUrl":"http://localhost:3000/photos/5329e44d-7a45-49a5-96eb-6ea0016da7eb.jpg"}
```

The files are in `storage/photos` and `storage/private`, as plain files: `storage/private/invoices/ord_1000.pdf` is the invoice. The `.nest-storage` folder in each holds temporary files during writes, and the metadata that a file name can't carry.

#### Testing

`InMemoryDisk` keeps files in memory and behaves like the other disks: the same key rules, ranges, listings, metadata and signed URLs. In an end-to-end test, replace the disks by overriding `STORAGE_MODULE_OPTIONS`, the options the factory would have returned:

```typescript
@@filename(test/photos.e2e-spec)
import type { INestApplication } from '@nestjs/common';
import { InMemoryDisk, STORAGE_MODULE_OPTIONS } from '@nestjs/storage';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

describe('Product photos', () => {
  let app: INestApplication;
  const photos = new InMemoryDisk({ publicUrl: 'https://photos.example.com' });
  const files = new InMemoryDisk({
    signedUrls: { baseUrl: 'https://api.example.com/files', keys: ['test-signing-key-0123456789abcdef'] },
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(STORAGE_MODULE_OPTIONS)
      .useValue({ default: 'private', disks: { photos, private: files } })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => photos.clear());

  it('stores the photo and returns its public URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/products/salmon-kibble-2kg/photo')
      .attach('photo', PNG, 'photo.png')
      .expect(201);

    const [key] = photos.keys();
    expect(res.body.photoUrl).toBe(`https://photos.example.com/${key}`);
    expect(await photos.getBuffer(key)).toEqual(PNG);
  });

  it('refuses a file that is not an image', async () => {
    await request(app.getHttpServer())
      .post('/products/salmon-kibble-2kg/photo')
      .attach('photo', Buffer.from('<html></html>'), 'photo.png')
      .expect(415);

    expect(photos.keys()).toEqual([]);
  });
});
```

The overridden options replace the factory's result, so the test needs no signing key and touches no file system. `keys()` lists what a disk holds and `clear()` empties it. The upload goes through multer and `uploadToDisk()` as in production; only the place the bytes land differs.

To test what reaches a real file system, use a `LocalDisk` on a temporary directory instead. For S3-specific behavior, such as presigned URLs or multipart uploads, point an `S3Disk` at MinIO or another S3-compatible server running locally.

#### Production checklist

- **Keep public and private files in separate buckets.** Give the photos bucket public read access, or put a CDN in front of it and point `publicUrl` at the CDN. Keep the private bucket fully private: invoices and uploads are only reachable through signed URLs. There is no per-file public flag, because new S3 buckets have object ACLs disabled, and a flag on one file is easy to get wrong.
- **Expire abandoned uploads.** Add a lifecycle rule to the private bucket that deletes objects under `incoming/` after a day, and one that aborts incomplete multipart uploads after a day.
- **Allow direct uploads from browsers with CORS.** The mobile app doesn't need it, but a web page that sends a `PUT` to a presigned URL does: allow `PUT` from your site's origin, with the `Content-Type` header.
- **Grant the app only what it uses.** An IAM policy with `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` and `s3:ListBucket` on the two buckets is enough. Keep `s3:ListBucket`: without it, S3 answers a request for a missing file with `403` instead of `404`, and `exists()` fails instead of returning `false`. For short-lived credentials, pass a `credentials` function that returns them.
- **Encrypt at rest.** S3 encrypts new objects by default; for a KMS key of your own, set `serverSideEncryption: 'aws:kms'` and `kmsKeyId` on the disk. R2 always encrypts.
- **Keep links short-lived.** Five minutes is plenty for a link a user clicks right away. A signed URL can't be revoked: it stays valid until it expires (or, on S3, until the credentials that signed it expire or lose access), so whoever it leaks to can use it until then.
- **Set a signing key per environment** for local disks (development and CI), from a secret, with at least 32 characters, and rotate it by putting the new key first in `keys`.
- **Don't use a local disk in production.** Files written to a container's disk vanish when the task is replaced, and other instances can't read them. Use S3, R2 or another object store (see [Use S3 or R2 in production](/application/file-storage#use-s3-or-r2-in-production)); local disks are for development and tests, and the module logs a warning at startup when it finds one with `NODE_ENV=production`.
- **Treat every key built from user input with care.** Keys are validated on every disk (no `..`, no absolute paths, no control characters), so user input can't escape a disk, but it can still name any file on it. Build keys from ids you control, as the upload endpoints above do.

#### Reference

##### Module options

`StorageModule.forRoot()` takes these options, and a `forRootAsync()` factory returns `default` and disk instances. Disk classes, `imports` and `isGlobal` sit next to `useFactory`, `useClass` or `useExisting`. The options are provided as `STORAGE_MODULE_OPTIONS`.

| Option | Default | Description |
| --- | --- | --- |
| `disks` | none (required) | Disks by name: instances, or `StorageDisk` classes that Nest instantiates, which can inject. See [Configure the disks](/application/file-storage#configure-the-disks). |
| `default` | the only disk | The disk that `StorageDisk` and `storage.disk()` resolve to. Required with more than one disk. |
| `imports` | none | Modules whose exports the disk classes inject. |
| `isGlobal` | `true` | Registers `Storage`, `StorageDisk` and the named disks globally. |

##### Disk methods

Every disk has the same methods, key rules and errors. A key is a relative, `/`-separated path of at most 1024 UTF-8 bytes, without empty, `.` or `..` segments, backslashes or control characters.

| Method | Description |
| --- | --- |
| `put(key, body, options)` | Writes a file atomically. Options: `contentType` (inferred from the extension by default), `cacheControl`, `contentDisposition`, `metadata` (string values, 2 KB in total), `contentLength`, `signal`. Resolves to `key`, `size`, `contentType` and `etag`. |
| `get(key, options)` | The file's metadata and its `body` as a Node stream. `range` takes `start` and an inclusive `end`, or `suffix`. |
| `getBuffer(key)`, `getText(key)` | The whole file. |
| `stat(key)`, `exists(key)` | The metadata without the body, or whether the file exists. |
| `delete(keys)` | One key or an array. Missing keys are ignored. |
| `list(options)`, `listAll(options)` | A page of `key`, `size`, `lastModified` and `etag` in UTF-8 byte order, with a `cursor`. Options: `prefix`, `cursor`, `limit` (up to 1000, the default). `listAll()` iterates every page. |
| `copy(from, to)`, `move(from, to)` | Within the disk, metadata included. |
| `url(key)` | The public URL under `publicUrl`. Throws without one. |
| `signedUrl(key, options)` | A download link. Options: `expiresIn` (default 15 minutes, at most 7 days), `filename`, `disposition`. See [Keep invoices private](/application/file-storage#keep-invoices-private). |
| `signedUpload(key, options)` | `url`, `method` (`PUT`), `headers` and `expiresAt` for a direct upload. Options: `contentType` (required), `contentLength`, `expiresIn`. See [Upload straight to storage from the mobile app](/application/file-storage#upload-straight-to-storage-from-the-mobile-app). |

##### Disks

| Disk | Options |
| --- | --- |
| `LocalDisk` | `root` (required, created at startup), `publicUrl`, `signedUrls`. For development and tests. `path(key)` returns a file's absolute path. |
| `S3Disk` | `bucket` (required), `region`, `endpoint`, `forcePathStyle`, `credentials`, `prefix`, `serverSideEncryption`, `kmsKeyId`, `multipart`, `retry`, `timeout`, `batchDelete`, `fetch`, `publicUrl`. See [Use S3 or R2 in production](/application/file-storage#use-s3-or-r2-in-production). |
| `InMemoryDisk` | `publicUrl`, `signedUrls`. For tests, with `keys()` and `clear()`. See [Testing](/application/file-storage#testing). |

`signedUrls` takes `baseUrl`, the route that serves the URLs, and `keys`, signing keys of at least 32 characters. The first key signs, and all of them verify. `S3Disk` defaults: `region` from `AWS_REGION`, then `AWS_DEFAULT_REGION`, then `us-east-1`; credentials from `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_SESSION_TOKEN`; `multipart` with a `partSize` of 8 MiB and a `concurrency` of 4; `retry: 3`, with backoff from 100 ms doubling to 20 seconds; no `timeout`; `batchDelete: true`.

##### HTTP helpers

| Helper | Options | Description |
| --- | --- | --- |
| `uploadToDisk(options)` | `disk` (a name or an instance, default the default disk), `contentTypes`, `cacheControl`, `key`, `metadata` | A storage engine for `FileInterceptor()`. `key` and `metadata` are functions of the file and the request. See [Upload product photos](/application/file-storage#upload-product-photos). |
| `serveFile(disk, key, options)` | `res` (required), `req`, `disposition` (default `attachment`), `filename`, `cacheControl` | Streams a file as the response, with `Range` and `If-None-Match` support when given `req`. |
| `serveSignedUrl(disk, options)` | `req`, `res`, `cacheControl` | Verifies and serves an app-served signed download URL. See [Serve signed URLs in development](/application/file-storage#serve-signed-urls-in-development). |
| `receiveSignedUpload(disk, options)` | `req`, `res`, `maxSize` | Verifies an app-served signed upload URL and streams the `PUT` body onto the disk. `maxSize` limits uploads signed without a `contentLength`. |
| `detectContentType(bytes)` | none | The type of a file from its first bytes: JPEG, PNG, GIF, WebP, AVIF, HEIC or PDF. |

##### Errors

Every error extends `StorageError`. Outside the HTTP helpers, they aren't `HttpException`s, so map them in your own code where they mean something to your API.

| Error | `status` | When |
| --- | --- | --- |
| `StorageFileNotFoundError` | 404 | `get()`, `stat()`, `copy()` or `move()` of a missing key. Has `key`. |
| `StorageInvalidKeyError` | 400 | A key that breaks the key rules. Has `reason`. |
| `StorageBodyLengthError` | 400 | The body didn't match `contentLength`. Has `expected` and `received`. |
| `StorageRangeNotSatisfiableError` | 416 | A range that starts past the end of the file. Has `size`. |
| `StorageKeyConflictError` | 409 | A local disk can't hold both `a` and `a/b`. |
| `StorageSignedUrlError` | 403 | A signed URL failed verification. `reason` is `missing`, `invalid`, `expired` or `method`. |
| `StorageServiceError` | none | The object store refused or failed. Has `code` (such as `AccessDenied` or `SlowDown`), `upstreamStatus`, `requestId` and `operation`. |
