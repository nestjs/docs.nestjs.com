### File Storage

[`@fozooni/nestjs-storage`](https://github.com/fozooni/nestjs-storage) is a driver-based storage module for NestJS. It exposes a single unified `FilesystemContract` interface that works identically across all storage backends — switch providers by changing config, not code. The module supports 9 built-in drivers: Local, S3, R2 (Cloudflare), GCS (Google Cloud), Azure Blob Storage, MinIO, Backblaze B2, DigitalOcean Spaces, and Wasabi.

> info **Note** `@fozooni/nestjs-storage` is a third-party package and is not officially maintained by the NestJS core team. If you encounter any issues, please report them in the [official repository](https://github.com/fozooni/nestjs-storage).

#### Installation

To get started, install the core package:

```bash
$ npm install @fozooni/nestjs-storage
```

Then install the peer dependency for the storage backend(s) you plan to use:

| Package | When to install |
|---------|----------------|
| `@aws-sdk/client-s3 @aws-sdk/s3-request-presigner` | S3, R2, MinIO, B2, DigitalOcean, Wasabi |
| `@aws-sdk/s3-presigned-post` | Presigned POST uploads on S3 / R2 |
| `@aws-sdk/cloudfront-signer` | CloudFront signed URLs with `CdnDisk` |
| `@google-cloud/storage` | GCS driver |
| `@azure/storage-blob` | Azure Blob Storage driver |
| `@opentelemetry/api` | `OtelDisk` tracing spans |
| `multer` / `@types/multer` | `StorageFileInterceptor` / `StorageFilesInterceptor` |
| `archiver` / `@types/archiver` | `StorageArchiver` (ZIP / TAR) |
| `zod` | Schema validation in `json()` |
| `@nestjs/terminus` | `StorageHealthIndicator` |

> info **Hint** You only need to install the peer dependencies for the drivers and features you actually use. The module provides graceful errors if a required peer dependency is missing.

#### Module setup

Import `StorageModule` into your root `AppModule` and configure it using `forRoot()`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { StorageModule } from '@fozooni/nestjs-storage';

@Module({
  imports: [
    StorageModule.forRoot({
      default: 'local',
      disks: {
        local: {
          driver: 'local',
          root: './storage',
          url: 'http://localhost:3000/storage',
        },
        s3: {
          driver: 's3',
          bucket: 'my-bucket',
          region: 'us-east-1',
          key: process.env.AWS_ACCESS_KEY_ID,
          secret: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
    }),
  ],
})
export class AppModule {}
```

The `default` property specifies which disk to use when none is explicitly provided. Setting `isGlobal: true` (which is the default) makes the module available throughout your application without needing to re-import it.

##### Async configuration

For applications that use the `ConfigModule` or need to resolve dependencies at runtime, use `forRootAsync()`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageModule } from '@fozooni/nestjs-storage';

@Module({
  imports: [
    ConfigModule.forRoot(),
    StorageModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        default: config.get('STORAGE_DRIVER'),
        disks: {
          local: {
            driver: 'local',
            root: './storage',
            url: config.get('APP_URL') + '/storage',
          },
          s3: {
            driver: 's3',
            bucket: config.get('AWS_BUCKET'),
            region: config.get('AWS_REGION'),
            key: config.get('AWS_ACCESS_KEY_ID'),
            secret: config.get('AWS_SECRET_ACCESS_KEY'),
          },
        },
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
      injectDisks: ['local', 's3'],
    }),
  ],
})
export class AppModule {}
```

> info **Hint** The `injectDisks` array is required when using `forRootAsync()` if you plan to use the `@InjectDisk()` decorator to inject specific disks.

#### Storage drivers

The module ships with 9 built-in drivers. Each driver implements the same `FilesystemContract` interface, so your application code stays identical regardless of which backend you choose.

| Driver | `driver` value | Required peer dependency |
|--------|---------------|--------------------------|
| Local filesystem | `'local'` | None |
| Amazon S3 | `'s3'` | `@aws-sdk/client-s3` |
| Cloudflare R2 | `'r2'` | `@aws-sdk/client-s3` |
| Google Cloud Storage | `'gcs'` | `@google-cloud/storage` |
| Azure Blob Storage | `'azure'` | `@azure/storage-blob` |
| MinIO | `'minio'` | `@aws-sdk/client-s3` |
| Backblaze B2 | `'b2'` | `@aws-sdk/client-s3` |
| DigitalOcean Spaces | `'digitalocean'` | `@aws-sdk/client-s3` |
| Wasabi | `'wasabi'` | `@aws-sdk/client-s3` |

<details><summary>Expand to see configuration examples for each driver</summary>

##### Local

```typescript
{
  driver: 'local',
  root: './storage',
  url: 'http://localhost:3000/storage',
  signSecret: 'my-32-char-secret-for-signed-urls',
  visibility: 'private',
}
```

##### S3

```typescript
{
  driver: 's3',
  bucket: 'my-bucket',
  region: 'us-east-1',
  key: 'AKIAIOSFODNN7EXAMPLE',
  secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
}
```

##### Cloudflare R2

```typescript
{
  driver: 'r2',
  bucket: 'my-bucket',
  accountId: 'your-cloudflare-account-id',
  key: 'access-key',
  secret: 'secret-key',
}
```

##### Google Cloud Storage

```typescript
{
  driver: 'gcs',
  bucket: 'my-bucket',
  projectId: 'my-project',
  keyFilename: '/path/to/service-account.json',
}
```

##### Azure Blob Storage

```typescript
{
  driver: 'azure',
  containerName: 'my-container',
  accountName: 'myaccount',
  accountKey: 'base64-encoded-key',
}
```

##### MinIO

```typescript
{
  driver: 'minio',
  bucket: 'my-bucket',
  endpoint: 'http://localhost:9000',
  key: 'minioadmin',
  secret: 'minioadmin',
  region: 'us-east-1',
}
```

##### Backblaze B2

```typescript
{
  driver: 'b2',
  bucket: 'my-bucket',
  endpoint: 'https://s3.us-west-004.backblazeb2.com',
  key: 'keyId',
  secret: 'applicationKey',
  region: 'us-west-004',
}
```

##### DigitalOcean Spaces

```typescript
{
  driver: 'digitalocean',
  bucket: 'my-space',
  region: 'nyc3',
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  key: 'access-key',
  secret: 'secret-key',
}
```

##### Wasabi

```typescript
{
  driver: 'wasabi',
  bucket: 'my-bucket',
  region: 'us-east-1',
  endpoint: 'https://s3.wasabisys.com',
  key: 'access-key',
  secret: 'secret-key',
}
```

</details>

#### Basic usage

Inject `StorageService` into any provider to start reading and writing files. All operations use the default disk unless you specify otherwise.

```typescript
@@filename(files.service)
import { Injectable } from '@nestjs/common';
import { StorageService } from '@fozooni/nestjs-storage';

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  async createFile(path: string, content: string): Promise<boolean> {
    return this.storage.put(path, content);
  }

  async readFile(path: string): Promise<string> {
    const buffer = await this.storage.get(path);
    return buffer.toString();
  }

  async deleteFile(path: string): Promise<boolean> {
    return this.storage.delete(path);
  }

  async fileExists(path: string): Promise<boolean> {
    return this.storage.exists(path);
  }
}
```

##### Core operations

The `FilesystemContract` interface provides the following core operations:

```typescript
// Write & read
await storage.put('reports/q1.txt', 'Quarterly report content');
const content = await storage.get('reports/q1.txt');
const stream = await storage.get('reports/q1.txt', { responseType: 'stream' });

// Check existence
const exists = await storage.exists('reports/q1.txt');

// Copy & move
await storage.copy('reports/q1.txt', 'archive/q1.txt');
await storage.move('temp/draft.txt', 'reports/final.txt');

// Delete
await storage.delete('temp/draft.txt');
await storage.deleteMany(['temp/a.txt', 'temp/b.txt']);

// File info
const bytes = await storage.size('reports/q1.txt');
const modified = await storage.lastModified('reports/q1.txt');
const mime = await storage.mimeType('reports/q1.txt');
const metadata = await storage.getMetadata('reports/q1.txt');
const hash = await storage.checksum('reports/q1.txt', 'sha256');

// Append & prepend
await storage.append('logs/app.log', 'New log entry\n');
await storage.prepend('logs/app.log', 'Header line\n');

// JSON with optional Zod validation
const data = await storage.json('config.json');
```

##### Directory operations

```typescript
// List files
const files = await storage.files('uploads/');
const allFiles = await storage.allFiles('uploads/');  // recursive

// List directories
const dirs = await storage.directories('uploads/');
const allDirs = await storage.allDirectories('uploads/');  // recursive

// Create & delete directories
await storage.makeDirectory('uploads/photos');
await storage.deleteDirectory('uploads/temp');

// Directory size
const totalBytes = await storage.directorySize('uploads/');
```

##### Visibility

```typescript
await storage.setVisibility('reports/q1.txt', 'public');
const visibility = await storage.getVisibility('reports/q1.txt');
// → 'public' | 'private'
```

#### Working with disks

##### Switching disks at runtime

Use the `disk()` method to switch between configured disks:

```typescript
@@filename(files.service)
import { Injectable } from '@nestjs/common';
import { StorageService } from '@fozooni/nestjs-storage';

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  async backupToCloud(path: string): Promise<void> {
    const content = await this.storage.disk('local').get(path);
    await this.storage.disk('s3').put(path, content);
  }
}
```

##### Injecting specific disks

Use the `@InjectDisk()` decorator to inject a specific disk directly:

```typescript
@@filename(photos.service)
import { Injectable } from '@nestjs/common';
import { InjectDisk, FilesystemContract } from '@fozooni/nestjs-storage';

@Injectable()
export class PhotosService {
  constructor(
    @InjectDisk('s3') private readonly photoDisk: FilesystemContract,
  ) {}

  async upload(photo: Express.Multer.File): Promise<string> {
    const result = await this.photoDisk.putFile('photos', photo);
    return result || '';
  }
}
```

##### Scoped disks

A scoped disk transparently prepends a prefix to all paths, which is useful for multi-tenant applications:

```typescript
@@filename(tenant-files.service)
import { Injectable } from '@nestjs/common';
import { StorageService, FilesystemContract } from '@fozooni/nestjs-storage';

@Injectable()
export class TenantFilesService {
  constructor(private readonly storage: StorageService) {}

  getDiskForTenant(tenantId: string): FilesystemContract {
    return this.storage.scope(`tenants/${tenantId}`);
  }
}
```

Nested scopes chain correctly — `scoped.scope('photos')` produces paths like `tenants/123/photos/...`.

#### File uploads

The module provides interceptors that handle file uploads and automatically store them to disk, replacing the standard Multer file object with a `StoredFile` containing the storage path and URL.

> info **Hint** Install the `multer` package and its type definitions before using storage interceptors: `npm install multer` and `npm install -D @types/multer`.

##### Single file upload

```typescript
@@filename(avatar.controller)
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { StorageFileInterceptor, StoredFile } from '@fozooni/nestjs-storage';

@Controller('users')
export class AvatarController {
  @Post('avatar')
  @UseInterceptors(StorageFileInterceptor('avatar', {
    disk: 's3',
    path: 'avatars/',
  }))
  async uploadAvatar(@UploadedFile() file: StoredFile) {
    return {
      url: file.url,
      path: file.path,
      size: file.size,
    };
  }
}
```

##### Multiple file upload

```typescript
@@filename(gallery.controller)
import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { StorageFilesInterceptor, StoredFile } from '@fozooni/nestjs-storage';

@Controller('gallery')
export class GalleryController {
  @Post('photos')
  @UseInterceptors(StorageFilesInterceptor('photos', 10, {
    disk: 's3',
    path: 'gallery/',
  }))
  async uploadPhotos(@UploadedFiles() files: StoredFile[]) {
    return files.map(f => ({ url: f.url, size: f.size }));
  }
}
```

The `StoredFile` object contains `path`, `url`, `size`, `mimetype`, `originalname`, and `disk`.

#### File validation

The module ships with two file validators that extend `FileValidator` from `@nestjs/common`. They can be combined with `ParseFilePipe` to validate uploads.

```typescript
@@filename(upload.controller)
import { Controller, Post, UploadedFile, ParseFilePipe, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileExtensionValidator, MagicBytesValidator } from '@fozooni/nestjs-storage';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileExtensionValidator({ allowedExtensions: ['.jpg', '.png', '.webp'] }),
          new MagicBytesValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return { filename: file.originalname };
  }
}
```

`FileExtensionValidator` checks the file extension (case-insensitive), while `MagicBytesValidator` reads the first bytes of the file buffer and compares them against known magic byte signatures. This prevents file extension spoofing without requiring any external dependencies.

#### Naming strategies

Naming strategies control how uploaded files are named when using `putFile()` or the storage interceptors. Four built-in strategies are available:

| Strategy | Output example | Description |
|----------|---------------|-------------|
| `UuidNamingStrategy` | `a4f3b2c1-xxxx-xxxx.jpg` | Random UUID + original extension |
| `HashNamingStrategy` | `d41d8cd98f00b204.jpg` | MD5 hash of content + extension (deterministic) |
| `DatePathNamingStrategy` | `2024/01/15/a4f3b2c1.jpg` | Date-based directory + UUID + extension |
| `OriginalNamingStrategy` | `photo.jpg` | Keeps the original filename unchanged |

Apply a naming strategy at the disk level or per operation:

```typescript
import { UuidNamingStrategy } from '@fozooni/nestjs-storage';

// In disk configuration
StorageModule.forRoot({
  default: 'local',
  disks: {
    local: {
      driver: 'local',
      root: './storage',
      namingStrategy: new UuidNamingStrategy(),
    },
  },
});

// Or per operation
await storage.putFile('uploads', file, {
  namingStrategy: new DatePathNamingStrategy(),
});
```

#### Signed & temporary URLs

##### Temporary URLs

Generate time-limited signed URLs for private files:

```typescript
const url = await storage.disk('s3').temporaryUrl(
  'private/report.pdf',
  new Date(Date.now() + 3600_000), // expires in 1 hour
);
```

For cloud drivers (S3, GCS, Azure), this creates a provider-native presigned URL. For the local driver, a HMAC-SHA256 signed URL is generated when `signSecret` is configured.

##### Local signed URL middleware

To protect local files served over HTTP, configure `signSecret` on the local disk and register the middleware:

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { StorageModule, LocalSignedUrlMiddleware } from '@fozooni/nestjs-storage';

@Module({
  imports: [
    StorageModule.forRoot({
      default: 'local',
      disks: {
        local: {
          driver: 'local',
          root: './storage',
          signSecret: 'a-secret-of-at-least-32-characters',
        },
      },
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocalSignedUrlMiddleware).forRoutes('/files/*');
  }
}
```

The middleware returns a `403` response for expired or invalid signatures, using `crypto.timingSafeEqual` to prevent timing attacks.

##### Presigned POST

For direct browser-to-storage uploads (bypassing your server), generate a presigned POST:

```typescript
const { url, fields } = await storage.disk('s3').presignedPost('uploads/user-photo.jpg', {
  expires: 3600,
  maxSize: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png'],
});
// Return `url` and `fields` to the client for a direct multipart/form-data upload
```

Presigned POST is supported by S3, R2, GCS, and Azure drivers.

#### Decorator disks

Decorator disks wrap an existing disk to add cross-cutting behaviour. They extend `DiskDecorator` and auto-delegate all `FilesystemContract` methods to the inner disk — override only the methods you need.

##### Encrypted disk

Transparent AES-256-GCM encryption. Each file gets a random 12-byte IV prepended to the ciphertext.

```typescript
const encrypted = storage.encrypted('local', {
  key: process.env.ENCRYPTION_KEY, // 32-byte key as hex string or Buffer
});

await encrypted.put('secrets/data.json', sensitiveContent);
const plaintext = await encrypted.get('secrets/data.json');
```

##### Cached disk

Caches metadata operations (`exists`, `size`, `lastModified`, `mimeType`, `getMetadata`, `getVisibility`) with configurable TTLs. Cache is automatically invalidated on write operations.

```typescript
const cached = storage.cached('s3', {
  ttl: 60_000,
  ttlByMethod: {
    exists: 30_000,
    size: 60_000,
    mimeType: 300_000,
  },
});
```

##### Retry disk

Automatic retries with exponential backoff and full-jitter for transient failures:

```typescript
const retried = storage.withRetry('s3', {
  maxRetries: 5,
  baseDelay: 100,
  maxDelay: 10_000,
});
```

By default, only `StorageNetworkError` is retried. Errors like `StorageFileNotFoundError` and `StoragePermissionError` are never retried.

##### Replicated disk

Write to multiple disks for redundancy:

```typescript
const replicated = storage.replicated('primary', [
  storage.disk('replica1'),
  storage.disk('replica2'),
], { strategy: 'all' });
// Strategies: 'all' | 'quorum' | 'async'
```

Reads are always served from the primary disk.

##### CDN disk

Override `url()` to return CDN URLs and generate CloudFront signed URLs via `temporaryUrl()`:

```typescript
// Auto-configured via the `cdn` field in disk config:
StorageModule.forRoot({
  default: 's3',
  disks: {
    s3: {
      driver: 's3',
      bucket: 'my-bucket',
      region: 'us-east-1',
      key: '...',
      secret: '...',
      cdn: {
        baseUrl: 'https://cdn.example.com',
        provider: 'cloudfront',
        signingKeyId: 'KXXXXXXXXXXXXX',
        signingKey: process.env.CLOUDFRONT_PRIVATE_KEY,
      },
    },
  },
});
```

##### OpenTelemetry disk

Wraps every async operation in an OpenTelemetry span. Zero-overhead when `@opentelemetry/api` is not installed.

```typescript
const traced = storage.withTracing('s3');
```

##### Quota disk

Enforce storage quotas per disk or per user:

```typescript
import { MemoryQuotaStore } from '@fozooni/nestjs-storage';

const quota = storage.withQuota('local', new MemoryQuotaStore(), {
  maxBytes: 1_073_741_824, // 1 GB
  prefix: 'users/123',
});

const { used, limit, percent } = await quota.getUsage();
```

Throws `StorageQuotaExceededError` when the limit is reached.

##### Versioned disk

Automatically snapshots previous content before every write:

```typescript
const versioned = storage.withVersioning('local');

await versioned.put('config.json', newContent);

const versions = await versioned.listVersions('config.json');
await versioned.restoreVersion('config.json', versions[0].versionId);
```

Snapshots are stored under a `.versions` directory alongside the original file path. Versioning failures never block the actual write.

##### Router disk

Route files to different disks based on extension, prefix, MIME type, or size:

```typescript
import { byExtension, byPrefix, bySize } from '@fozooni/nestjs-storage';

const router = storage.withRouting([
  byExtension(['.jpg', '.png', '.webp'], storage.disk('images-s3')),
  byPrefix('docs/', storage.disk('docs-gcs')),
  bySize(5 * 1024 * 1024, storage.disk('small-local')),
], storage.disk('default'));
```

First-match wins on write. Cross-disk `copy()` and `move()` are handled transparently.

#### Streaming & range requests

##### Streaming files

Use `getStreamableFile()` to return files from NestJS controllers with proper headers:

```typescript
@@filename(download.controller)
import { Controller, Get, Param, StreamableFile } from '@nestjs/common';
import { StorageService } from '@fozooni/nestjs-storage';

@Controller('download')
export class DownloadController {
  constructor(private readonly storage: StorageService) {}

  @Get(':path')
  async download(@Param('path') path: string): Promise<StreamableFile> {
    return this.storage.getStreamableFile(path, {
      filename: path,
      disposition: 'attachment',
    });
  }
}
```

##### Range requests

For video streaming or large file downloads, use `serveRange()` which automatically handles the HTTP `Range` header:

```typescript
@@filename(stream.controller)
import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { StorageService } from '@fozooni/nestjs-storage';

@Controller('stream')
export class StreamController {
  constructor(private readonly storage: StorageService) {}

  @Get(':path')
  async stream(
    @Param('path') path: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.storage.serveRange(path, req, res, 's3');
  }
}
```

This sets `Content-Range`, `Content-Length`, and `Accept-Ranges` headers automatically, returning HTTP `206` for partial content or `200` for the full file.

#### Multipart uploads

For large files, the module supports multipart uploads on cloud drivers:

```typescript
@@filename(large-upload.service)
import { Injectable } from '@nestjs/common';
import { StorageService } from '@fozooni/nestjs-storage';

@Injectable()
export class LargeUploadService {
  constructor(private readonly storage: StorageService) {}

  async uploadLargeFile(file: Express.Multer.File): Promise<string | false> {
    const disk = this.storage.disk('s3');
    return disk.putFileMultipart('uploads/large', file, {
      chunkSize: 10 * 1024 * 1024, // 10 MB chunks
      onProgress: (loaded, total) => {
        console.log(`Progress: ${((loaded / total) * 100).toFixed(1)}%`);
      },
    });
  }
}
```

For finer control, you can manage parts individually:

```typescript
const { uploadId } = await disk.initMultipartUpload('large-file.zip');
const part1 = await disk.uploadPart(uploadId, 1, chunk1, 'large-file.zip');
const part2 = await disk.uploadPart(uploadId, 2, chunk2, 'large-file.zip');
await disk.completeMultipartUpload(uploadId, 'large-file.zip', [part1, part2]);
```

#### Conditional writes

Conditional writes prevent race conditions when multiple processes write to the same file. They are supported on Local, S3, and FakeDisk drivers.

```typescript
// Write only if the current ETag matches (optimistic locking)
const result = await disk.putIfMatch('config.json', newContent, 'known-etag');
if (!result.success) {
  // ETag mismatch — file was modified by another process
}

// Write only if the file does not exist (create-once pattern)
const result = await disk.putIfNoneMatch('config.json', initialContent);
if (!result.success) {
  // File already exists
}
```

#### Events & audit logging

##### Storage events

`StorageEventsService` emits events after each storage operation. You can subscribe to them for logging, analytics, or triggering side effects.

```typescript
@@filename(storage-listener.service)
import { Injectable } from '@nestjs/common';
import { StorageEventsService, StorageEvents } from '@fozooni/nestjs-storage';

@Injectable()
export class StorageListenerService {
  constructor(private readonly events: StorageEventsService) {
    this.events.on(StorageEvents.PUT, (event) => {
      console.log('File written:', event.path);
    });

    this.events.on(StorageEvents.DELETE, (event) => {
      console.log('File deleted:', event.path);
    });
  }
}
```

Available events: `storage.put`, `storage.put_file`, `storage.delete`, `storage.delete_many`, `storage.copy`, `storage.move`, `storage.retry`.

##### Audit logging

Enable audit logging by setting `auditLog: true` in the module config:

```typescript
StorageModule.forRoot({
  default: 'local',
  disks: { ... },
  auditLog: true,
})
```

The default sink logs to the NestJS Logger. You can add custom sinks for your own logging pipeline:

```typescript
@@filename(audit-setup.service)
import { Injectable } from '@nestjs/common';
import { StorageAuditService } from '@fozooni/nestjs-storage';

@Injectable()
export class AuditSetupService {
  constructor(private readonly audit: StorageAuditService) {
    this.audit.addSink({
      log(entry) {
        // Send to your logging service
        externalLogger.info({
          operation: entry.operation,
          disk: entry.disk,
          path: entry.path,
          timestamp: entry.timestamp,
          success: entry.success,
        });
      },
    });
  }
}
```

#### File archiving

`StorageArchiver` creates streaming ZIP or TAR archives from files on any disk. Files are appended as streams, so the archive is never buffered in memory.

> info **Hint** Install the `archiver` package and its type definitions: `npm install archiver` and `npm install -D @types/archiver`.

```typescript
@@filename(export.controller)
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { StorageArchiver, StorageService } from '@fozooni/nestjs-storage';

@Controller('export')
export class ExportController {
  constructor(
    private readonly archiver: StorageArchiver,
    private readonly storage: StorageService,
  ) {}

  @Get('reports')
  async downloadReports(@Res() res: Response) {
    const stream = await this.archiver.createZip([
      { path: 'reports/q1.pdf', name: 'Q1 Report.pdf' },
      { path: 'reports/q2.pdf', name: 'Q2 Report.pdf' },
      { path: 'reports/q3.pdf' },  // name defaults to basename
    ], this.storage.disk('s3'), { zlib: { level: 6 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.zip"');
    stream.pipe(res);
  }
}
```

Use `createTar()` for TAR archives with the same API.

#### Data migration

`StorageMigrator` copies files between disks using an async generator — files are never loaded all into memory at once.

```typescript
@@filename(migration.service)
import { Injectable } from '@nestjs/common';
import { StorageService, StorageMigrator } from '@fozooni/nestjs-storage';

@Injectable()
export class MigrationService {
  constructor(
    private readonly storage: StorageService,
    private readonly migrator: StorageMigrator,
  ) {}

  async migrateToCloud() {
    const source = this.storage.disk('local');
    const target = this.storage.disk('s3');

    for await (const progress of this.migrator.migrate(source, target, {
      prefix: 'uploads/',
      concurrency: 10,
      verify: true,
      onError: 'skip',
    })) {
      if (progress.status === 'failed') {
        console.error('Failed:', progress.path, progress.error?.message);
      }
    }
  }
}
```

Options include `prefix` (filter files), `concurrency`, `verify` (checksum verification), `deleteSource`, `dryRun`, and `onError` (`'skip'` or `'abort'`).

#### Health checks

The module provides a `StorageHealthIndicator` for use with the `@nestjs/terminus` health check system. It performs a write/read/delete cycle on the target disk to verify connectivity.

> info **Hint** Install the `@nestjs/terminus` package: `npm install @nestjs/terminus`.

```typescript
@@filename(health.controller)
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { StorageHealthIndicator } from '@fozooni/nestjs-storage';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly storageHealth: StorageHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.storageHealth.check('storage', 'local'),
      () => this.storageHealth.checkDisks('all-storage', ['local', 's3'], {
        timeout: 3000,
      }),
    ]);
  }
}
```

#### Temporary files

Write files with a time-to-live (TTL). For the local driver, a `.ttl` sidecar file is created alongside the content. For S3, the `Expires` metadata header is set.

```typescript
await disk.putTemp('tmp/session-data.json', content, 3600); // expires in 1 hour
```

Use `StorageTempCleanupService` to remove expired files. You can run cleanup manually or schedule it with `@nestjs/schedule`:

```typescript
@@filename(cleanup.service)
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StorageTempCleanupService } from '@fozooni/nestjs-storage';

@Injectable()
export class CleanupService {
  constructor(private readonly cleanup: StorageTempCleanupService) {}

  @Cron('0 * * * *')
  async handleCleanup() {
    const { deleted, errors } = await this.cleanup.runOnce('local');
  }
}
```

#### Error handling

The module provides a typed error hierarchy. All storage errors extend the base `StorageError` class:

| Error class | Description |
|------------|-------------|
| `StorageFileNotFoundError` | File or directory does not exist |
| `StoragePermissionError` | Access denied or unsupported operation |
| `StorageNetworkError` | Transient failure (safe to retry) |
| `StorageConfigurationError` | Missing config or missing peer dependency |
| `StorageQuotaExceededError` | Storage quota exceeded |

```typescript
import {
  StorageError,
  StorageFileNotFoundError,
  StorageNetworkError,
} from '@fozooni/nestjs-storage';

try {
  await storage.get('missing.txt');
} catch (error) {
  if (error instanceof StorageFileNotFoundError) {
    // File not found — handle 404
  } else if (error instanceof StorageNetworkError) {
    // Transient failure — safe to retry
  } else if (error instanceof StorageError) {
    // Any other storage error
  }
}
```

#### Custom drivers

You can register custom drivers by implementing `FilesystemContract` and using `storage.extend()`:

```typescript
@@filename(custom-disk)
import { FilesystemContract, DiskConfig } from '@fozooni/nestjs-storage';

export class CustomDisk implements FilesystemContract {
  constructor(private readonly config: DiskConfig) {}

  async exists(path: string): Promise<boolean> {
    // your implementation
  }

  async get(path: string): Promise<Buffer> {
    // your implementation
  }

  async put(path: string, contents: string | Buffer): Promise<boolean> {
    // your implementation
  }

  // ... implement remaining required methods
}
```

```typescript
@@filename(app.module)
import { Module, OnModuleInit } from '@nestjs/common';
import { StorageService, StorageModule } from '@fozooni/nestjs-storage';
import { CustomDisk } from './custom-disk';

@Module({
  imports: [
    StorageModule.forRoot({
      default: 'custom',
      disks: {
        custom: { driver: 'my-driver', /* your fields */ },
      },
    }),
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly storage: StorageService) {}

  onModuleInit() {
    this.storage.extend('my-driver', (config) => new CustomDisk(config));
  }
}
```

To add cross-cutting behaviour, extend `DiskDecorator` instead. All methods are auto-delegated to the wrapped disk — override only the ones you need:

```typescript
import { DiskDecorator, PutOptions } from '@fozooni/nestjs-storage';

class LoggingDisk extends DiskDecorator {
  async put(path: string, contents: any, options?: PutOptions): Promise<boolean> {
    console.log('Writing to', path);
    return super.put(path, contents, options);
  }
}
```

#### Testing

The module provides `FakeDisk`, a full in-memory `FilesystemContract` implementation, and `StorageTestUtils` to simplify testing.

```typescript
@@filename(files.service.spec)
import { Test } from '@nestjs/testing';
import { StorageService, StorageTestUtils, FakeDisk } from '@fozooni/nestjs-storage';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;
  let fakeDisk: FakeDisk;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FilesService, StorageService],
    }).compile();

    service = module.get(FilesService);
    const storage = module.get(StorageService);
    fakeDisk = StorageTestUtils.fake(storage);
  });

  afterEach(() => {
    fakeDisk.reset();
  });

  it('should write and read a file', async () => {
    await service.createFile('test.txt', 'Hello');

    fakeDisk.assertExists('test.txt');
    fakeDisk.assertContentEquals('test.txt', 'Hello');
  });

  it('should delete a file', async () => {
    await fakeDisk.put('test.txt', 'Hello');
    await service.deleteFile('test.txt');

    fakeDisk.assertMissing('test.txt');
  });
});
```

`FakeDisk` includes assertion helpers: `assertExists()`, `assertMissing()`, `assertCount()`, `assertDirectoryEmpty()`, and `assertContentEquals()`. Use `StorageTestUtils.fakeFile()` to create mock `Multer.File` objects for upload testing.

#### More information

Visit the [`@fozooni/nestjs-storage` documentation](https://fozooni.github.io/nestjs-storage/) for detailed API reference and additional examples.
