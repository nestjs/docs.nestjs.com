### Build a file upload service in Node.js

Build a file upload service in Node.js with NestJS: streamed uploads with type and size checks, S3 storage, per-user quotas and expiring download links.

Users upload images and PDF documents, download them through the API or through links that expire after five minutes, and delete them, each user within a storage quota of their own. Uploading a file looks like one line of code, and most of what goes wrong happens around it: a file that claims to be a PNG and is an HTML page, a 2 GB upload held in memory, two uploads that both fit in the last free megabyte, and bytes left on the disk that nothing points to. This tutorial handles each of these, with the same code on a laptop folder and on S3.

By the end, the API will:

- Stream each upload straight onto storage with [`@nestjs/storage`](/application/file-storage), after checking its type from its first bytes and while counting its size, so nothing is buffered in memory or written to a temporary file.
- Keep the files in a local folder in development and in S3, R2 or MinIO in production, with configuration alone.
- Record each file in PostgreSQL, where only its owner can see it.
- Hold every user to a storage quota with one conditional `UPDATE`, so uploads that run at the same time can't exceed it.
- Stream downloads with the right `Content-Type` and `Content-Disposition`, and hand out signed links that expire after five minutes.
- Delete a file's row before its bytes, so a row never points at a missing file.

It starts from the API of [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication), which signs users in with access and refresh tokens, validates requests with Zod, and keeps its data in PostgreSQL through Drizzle. This tutorial doesn't explain those parts again.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /auth/sign-up`, `POST /auth/token`, `POST /auth/token/refresh`, `POST /auth/token/revoke`, `GET /me`, `GET /health/live`, `GET /health/ready` | [Start from the JWT API](/tutorials/file-uploads#start-from-the-jwt-api) |
| `POST /files`, `GET /files`, `GET /files/:id` | [Accept uploads](/tutorials/file-uploads#accept-uploads) |
| `GET /me/storage` | [Stay within the quota](/tutorials/file-uploads#stay-within-the-quota) |
| `GET /files/:id/content`, `GET /files/:id/link`, `GET /downloads` | [Download files](/tutorials/file-uploads#download-files) |
| `DELETE /files/:id` | [Delete files](/tutorials/file-uploads#delete-files) |

> info **Hint** The finished application is on GitHub as [nestjs/example-file-uploads](https://github.com/nestjs/example-file-uploads), with its tests and a CI workflow.

#### Start from the JWT API

Create the project, and install everything this tutorial uses. These are the JWT tutorial's packages plus `@nestjs/storage`:

```bash
$ npm i -g @nestjs/cli
$ nest new files-api --minimal
$ cd files-api
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/drizzle drizzle-orm@rc pg @nestjs/authentication @nestjs/storage @nestjs/throttler @nestjs/swagger @nestjs/terminus
$ npm i --save-dev drizzle-kit@rc @types/pg @nestjs/testing vitest vite
```

Then take these files from the [finished JWT tutorial](/tutorials/rest-api-jwt-authentication#sign-users-in-with-jwts), as they are:

- `src/main.ts` and `drizzle.config.ts`
- everything under `src/auth/`, `src/users/` and `src/health/`
- `test/refresh-token.store.e2e-spec.ts`

Leave out `src/notes/` and the JWT tutorial's `drizzle/` folder: this application's first migration comes from its own schema, in the next section. Rename the notes to the files where they're named: the `realm` in `JwtAuth` (`'files'`) and the title of the OpenAPI document in `main.ts`. `src/config.ts`, `src/app.module.ts` and `vitest.config.e2e.ts` change in this tutorial, and are shown in full below. Add the test script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Finally, add the database's URL and a `JWT_SECRET` to `.env`, as in the JWT tutorial, with a database of the application's own:

```bash
$ docker run -d --name files-db -e POSTGRES_PASSWORD=files -e POSTGRES_DB=files -p 5432:5432 postgres:17
```

Its URL goes in `.env`, next to the signing secret:

```bash
DATABASE_URL=postgres://postgres:files@localhost:5432/files
# Generate with: openssl rand -base64 32
JWT_SECRET=
```

The application uses multer through the upload interceptors of `@nestjs/platform-node`, which depends on it, so there's nothing else to install. It doesn't need `@types/multer` either: the uploaded file's type comes from `@nestjs/storage`.

#### Design the schema

The whole schema, in one file. The refresh tokens are the JWT tutorial's. The users gain two columns, and a table records the files:

```typescript
@@filename(src/database/schema)
import { sql } from 'drizzle-orm';
import { bigint, boolean, check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
// Byte counts: a 32-bit integer stops at 2 GiB.
const bytes = (name: string) => bigint(name, { mode: 'number' });

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    // What the user's files take up, and how much they may store: 100 MiB unless changed.
    storageUsed: bytes('storage_used').notNull().default(0),
    storageQuota: bytes('storage_quota')
      .notNull()
      .default(100 * 1024 * 1024),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [check('users_storage_used_not_negative', sql`${table.storageUsed} >= 0`)],
);

export const files = pgTable(
  'files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Where the bytes are on the disk. The server picks it, never the client.
    key: text('key').notNull().unique(),
    // The client's file name, for downloads only.
    name: text('name').notNull(),
    // Detected from the bytes, not taken from the client.
    contentType: text('content_type').notNull(),
    size: bytes('size').notNull(),
    createdAt: at('created_at').notNull().defaultNow(),
  },
  (table) => [index('files_owner_id_created_at_idx').on(table.ownerId, table.createdAt)],
);

// What @nestjs/authentication keeps for refresh tokens, stored by their SHA-256.
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: text('id').primaryKey(),
    familyId: text('family_id').notNull(),
    userId: text('user_id').notNull(),
    createdAt: at('created_at').notNull(),
    expiresAt: at('expires_at').notNull(),
    familyExpiresAt: at('family_expires_at').notNull(),
    usedAt: at('used_at'),
    // A family is revoked when any of its tokens is.
    revoked: boolean('revoked').notNull().default(false),
    claims: jsonb('claims').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('refresh_tokens_family_id_idx').on(table.familyId),
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_family_expires_at_idx').on(table.familyExpiresAt),
  ],
);

export type StoredFile = typeof files.$inferSelect;
```

- **The bytes live on the disk; the row says whose they are.** `key` is where the file is on the disk, and nothing reaches it without going through a row with the right `owner_id`. Clients never see the key.
- **Byte counts are `bigint`.** A PostgreSQL `integer` stops at 2 GiB, which one user's files pass easily. `mode: 'number'` returns them as JavaScript numbers, exact up to 8 PiB.
- **The quota is a column, not a constant.** A user on a bigger plan gets a bigger number, and the tests set a small one.
- **`storage_used` can't go below zero.** The service never tries, but if a future change subtracts a file twice, PostgreSQL refuses the write instead of storing a negative usage.
- **`content_type` is what the bytes are**, detected on upload. The client's claim isn't stored at all.

Generate the migration and apply it (see [Migrations](/data/drizzle#migrations)):

```bash
$ npx drizzle-kit generate --name=files
$ npx drizzle-kit migrate
```

#### Configure the storage

[`@nestjs/storage`](/application/file-storage) keeps files on named **disks**, with one API for all of them: `put()`, `get()`, `delete()`, `signedUrl()` and the rest. This application has one disk, `files`. In development it's a folder; in production it's a bucket, because containers lose their file system on every deploy, and the instances of an API don't share one.

The configuration says which, and validates what each needs. A local disk signs its own download links, so it needs a signing key; an S3 disk needs a bucket:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(3000),
    DATABASE_URL: z.url(),
    // Signs the access tokens: at least 32 bytes.
    JWT_SECRET: z.string().min(32),
    // The browser origins allowed to call the API, comma-separated. None by default.
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
      .pipe(z.array(z.url())),
    // Where clients reach the API: local download links point here.
    APP_URL: z.url().default('http://localhost:3000'),
    // 'local' in development, 's3' in production (AWS S3, Cloudflare R2, MinIO...).
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_ROOT: z.string().default('storage'),
    // Signs the local disk's download links: at least 32 characters.
    STORAGE_SIGNING_KEY: z.string().min(32).optional(),
    S3_BUCKET: z.string().min(1).optional(),
    S3_REGION: z.string().min(1).optional(),
    // For S3-compatible stores only; AWS S3 needs none.
    S3_ENDPOINT: z.url().optional(),
    S3_FORCE_PATH_STYLE: z.stringbool().default(false),
  })
  .refine((env) => env.STORAGE_DRIVER !== 'local' || env.STORAGE_SIGNING_KEY, {
    path: ['STORAGE_SIGNING_KEY'],
    message: 'Required when STORAGE_DRIVER is local',
  })
  .refine((env) => env.STORAGE_DRIVER !== 's3' || env.S3_BUCKET, {
    path: ['S3_BUCKET'],
    message: 'Required when STORAGE_DRIVER is s3',
  });

export type Env = z.infer<typeof envSchema>;
```

Add the key to `.env`:

```bash
# Generate with: openssl rand -hex 32
STORAGE_SIGNING_KEY=
```

A factory builds the disk from the configuration:

```typescript
@@filename(src/storage/storage.config)
import type { ConfigService } from '@nestjs/config';
import { LocalDisk, S3Disk, type StorageModuleOptions } from '@nestjs/storage';
import type { Env } from '../config.js';

/** One private disk, `files`: a local folder in development, a bucket in production. */
export function createStorageOptions(config: ConfigService<Env, true>): StorageModuleOptions {
  if (config.get('STORAGE_DRIVER', { infer: true }) === 's3') {
    return {
      disks: {
        // Credentials come from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.
        files: new S3Disk({
          bucket: config.get('S3_BUCKET', { infer: true })!,
          region: config.get('S3_REGION', { infer: true }),
          endpoint: config.get('S3_ENDPOINT', { infer: true }),
          forcePathStyle: config.get('S3_FORCE_PATH_STYLE', { infer: true }),
        }),
      },
    };
  }
  return {
    disks: {
      files: new LocalDisk({
        root: config.get('STORAGE_ROOT', { infer: true }),
        // A folder can't sign URLs the way S3 does: the app signs them, and serves them at /downloads.
        signedUrls: {
          baseUrl: `${config.get('APP_URL', { infer: true })}/downloads`,
          keys: [config.get('STORAGE_SIGNING_KEY', { infer: true })!],
        },
      }),
    },
  };
}
```

- **The local disk keeps files under `STORAGE_ROOT`**, `storage/` in the project's directory, and creates it at startup. Add it to `.gitignore`.
- **A folder can't presign URLs the way S3 does**, so with `signedUrls`, the local disk signs its own links with HMAC-SHA256, under `baseUrl`. The application serves them at `/downloads`, in [Download files](/tutorials/file-uploads#download-files).
- **The S3 disk is the same class for AWS S3, Cloudflare R2 and MinIO.** [Use S3 in production](/tutorials/file-uploads#use-s3-in-production) sets it up.

Register `StorageModule` in the root module, with the factory. It's global, so any provider can inject the disk. With the files module of the next sections, the root module is:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { DrizzleModule } from '@nestjs/drizzle';
import { createObserveModule } from '@nestjs/observe';
import { StorageModule } from '@nestjs/storage';
import { ThrottlerGuard, ThrottlerModule, minutes, normalizeIp } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accountEmail } from './auth/account-email.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema, type Env } from './config.js';
import { FilesModule } from './files/files.module.js';
import { HealthModule } from './health/health.module.js';
import { createStorageOptions } from './storage/storage.config.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'files-api',
    }),
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        accessToken: {
          key: config.get('JWT_SECRET', { infer: true }),
          issuer: 'files-api',
          audience: 'files-api',
          ttl: '15m',
        },
        refreshToken: { ttl: '30d', absoluteTtl: '90d' },
      }),
    }),
    StorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createStorageOptions,
    }),
    ThrottlerModule.forRoot([
      // Per IP address, on every route.
      { name: 'default', ttl: minutes(1), limit: 100 },
      // Per email and IP address, wherever the request body names an account.
      {
        name: 'account',
        ttl: minutes(15),
        limit: 5,
        skipIf: (context) => !accountEmail(context.switchToHttp().getRequest()),
        getTracker: (req) => `${accountEmail(req)}|${normalizeIp(req.ip)}`,
      },
    ]),
    UsersModule,
    AuthModule,
    FilesModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

#### Accept uploads

Users may upload JPEG, PNG, WebP and GIF images and PDF documents, of up to 10 MiB each:

```typescript
@@filename(src/files/file-rules)
/** What users may upload: images and PDF documents, recognized by their bytes. */
export const FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
```

The upload route uses `FileInterceptor()`, as any upload in Nest does. On the Node adapter, it comes from `@nestjs/platform-node` (see [Other packages](/http/performance#other-packages)). What's particular is its `storage` option: `uploadToDisk()` is a multer storage engine that streams the file onto the disk as it arrives, instead of into memory (multer's default) or a temporary folder. The controller has every route of this tutorial; the next sections explain the ones after `findOne()`:

```typescript
@@filename(src/files/files.controller)
import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { FileInterceptor, type NodeRequest, type NodeResponse } from '@nestjs/platform-node';
import { uploadToDisk, type StoredUpload } from '@nestjs/storage';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { z } from 'zod';
import type { User } from '../users/user.js';
import { FILE_TYPES, MAX_FILE_SIZE } from './file-rules.js';
import { listFilesQuerySchema, type ListFilesQuery } from './files.schemas.js';
import { FilesService } from './files.service.js';

const fileId = { schema: z.uuid() };

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      // Streams the file onto the disk as it arrives, after checking its first bytes.
      storage: uploadToDisk({
        contentTypes: FILE_TYPES,
        // The authentication guard has run: the key starts with the owner's id.
        key: (file, req: { user: User }) => `${req.user.id}/${randomUUID()}${file.extension}`,
      }),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      // File names in UTF-8, as browsers send them, rather than multer's default latin1.
      defParamCharset: 'utf8',
    }),
  )
  upload(@CurrentUser('id') userId: string, @UploadedFile() file: StoredUpload | undefined) {
    if (!file) {
      throw new BadRequestException('Attach the file as the "file" field');
    }
    return this.filesService.create(userId, file);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query({ schema: listFilesQuerySchema }) query: ListFilesQuery) {
    return this.filesService.findAll(userId, query);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id', fileId) id: string) {
    return this.filesService.findOne(userId, id);
  }

  @Get(':id/content')
  content(
    @CurrentUser('id') userId: string,
    @Param('id', fileId) id: string,
    @Req() req: NodeRequest,
    @Res({ passthrough: true }) res: NodeResponse,
  ) {
    return this.filesService.content(userId, id, req, res);
  }

  @Get(':id/link')
  link(@CurrentUser('id') userId: string, @Param('id', fileId) id: string) {
    return this.filesService.link(userId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser('id') userId: string, @Param('id', fileId) id: string) {
    return this.filesService.remove(userId, id);
  }
}
```

By the time `upload()` runs, the file is on the disk, and these checks have passed:

- **The guards ran first.** A request without a valid token gets a 401 before a byte of the body is read, so `req.user` is set when `key()` builds the key, which starts with the owner's id.
- **The type is what the bytes are, not what the client says.** A browser sends the type it guesses from the file name, and a script sends anything. `uploadToDisk()` reads the file's first bytes, detects its type from their signature, and refuses anything not in `FILE_TYPES` with a `415 Unsupported Media Type` before writing a byte. So a text file sent as `image/png` is refused, and a PDF renamed to `.png` is stored as a PDF.
- **The size is counted as the file streams.** multer stops reading at `limits.fileSize`, and `uploadToDisk()` refuses to keep what it received: the client gets a `413 Payload Too Large`, as [File size limit](/http/file-upload#file-size-limit) describes, and nothing is stored. `files: 1` refuses a second file in the same request with a `400 Too many files`, and the first one isn't kept either.
- **The key is the server's.** The owner's id, a random UUID, and the extension of the detected type. The client's file name never becomes part of a path.

`ParseFilePipe` and its validators, which the [file upload chapter](/http/file-upload#file-validation) describes, run after the interceptor, when a streamed file is already stored, and `FileTypeValidator` needs the file in memory. With `uploadToDisk()`, the engine does both checks. `@UploadedFile()` then returns a `StoredUpload`: `key`, `size` and `contentType`, the detected type, with multer's `originalname` and `mimetype`, the client's claims.

`defParamCharset: 'utf8'` matters for names that aren't plain ASCII, such as a German invoice name with an umlaut. Browsers and curl send file names in UTF-8, and multer decodes them as Latin-1 by default, so each non-ASCII character would be stored as two wrong ones.

#### Stay within the quota

The file is stored; recording it is the service's job, and so is the quota. The obvious version reads the user's usage, checks that the new file fits, and writes the new usage. Two uploads that arrive together both read the same usage, both pass the check, and both are recorded. A test at the end of this tutorial sends five 3,000-byte uploads at once against a quota of 10,000 bytes: that version accepted all five in every run.

The service below checks and takes the quota in one statement:

```typescript
@@filename(src/files/files.service)
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { StorageDisk, type StoredUpload } from '@nestjs/storage';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { files, users } from '../database/schema.js';
import type { ListFilesQuery } from './files.schemas.js';

// What the API returns: everything but the storage key.
const columns = {
  id: files.id,
  name: files.name,
  contentType: files.contentType,
  size: files.size,
  createdAt: files.createdAt,
};

@Injectable()
export class FilesService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    // The default disk: the only one, `files`.
    private readonly disk: StorageDisk,
  ) {}

  /** Records an upload that `uploadToDisk()` has already stored, if it fits in the owner's quota. */
  async create(ownerId: string, upload: StoredUpload) {
    try {
      return await this.db.transaction(async (tx) => {
        // Checks and takes the quota in one statement: two uploads can't both fit in the last free bytes.
        const [owner] = await tx
          .update(users)
          .set({ storageUsed: sql`${users.storageUsed} + ${upload.size}` })
          .where(and(eq(users.id, ownerId), sql`${users.storageUsed} + ${upload.size} <= ${users.storageQuota}`))
          .returning({ id: users.id });
        if (!owner) {
          throw new ConflictException('Storage quota exceeded');
        }
        const [file] = await tx
          .insert(files)
          .values({
            ownerId,
            key: upload.key,
            name: displayName(upload.originalname),
            // Detected from the bytes: `upload.mimetype` is only what the client claimed.
            contentType: upload.contentType,
            size: upload.size,
          })
          .returning(columns);
        return file;
      });
    } catch (error) {
      // The bytes are stored already: don't leave them behind for a file that doesn't exist.
      await this.disk.delete(upload.key);
      throw error;
    }
  }

  findAll(ownerId: string, { limit, offset }: ListFilesQuery) {
    return this.db
      .select(columns)
      .from(files)
      .where(eq(files.ownerId, ownerId))
      .orderBy(desc(files.createdAt), desc(files.id))
      .limit(limit)
      .offset(offset);
  }

  async findOne(ownerId: string, id: string) {
    const [file] = await this.db.select(columns).from(files).where(this.owned(ownerId, id));
    return file ?? notFound();
  }

  async usage(ownerId: string) {
    const [usage] = await this.db
      .select({ used: users.storageUsed, quota: users.storageQuota })
      .from(users)
      .where(eq(users.id, ownerId));
    return usage;
  }

  // content(), link() and remove() follow in the next sections.

  private owned(ownerId: string, id: string) {
    return and(eq(files.id, id), eq(files.ownerId, ownerId));
  }
}

function notFound(): never {
  throw new NotFoundException('File not found');
}

/** The client's file name, without control characters, at most 255 characters. */
function displayName(originalname: string): string {
  const name = originalname.replace(/[\x00-\x1f\x7f]/g, '').trim();
  return name.slice(0, 255) || 'file';
}
```

- **The `UPDATE` adds the file's size only where the sum stays within the quota.** PostgreSQL locks the user's row while it updates it, so a second upload's `UPDATE` waits for the first transaction to finish, then sees the usage it left. When the file doesn't fit, the statement changes no row and returns nothing, and the service throws.
- **The row and the usage change together.** The insert runs in the same [transaction](/data/drizzle#drizzle-transactions), through `tx`, so a failed insert gives the quota back.
- **A refused upload's bytes are deleted.** `uploadToDisk()` stored them before the handler ran. Whatever goes wrong afterwards, a quota or a database error, the `catch` removes them, so a refused upload doesn't use space that no quota counts.
- **The quota answer is a 409, not a 413.** A `413` tells the client that this file is too large to be accepted, ever. A `409 Conflict` tells it that the request is fine but the account's state refuses it: delete some files, and the same upload succeeds.
- **The size and type come from the upload**, as stored: `upload.size` is the bytes written, and `upload.contentType` the detected type.

The list takes a page size and an offset, as the notes did in the JWT tutorial:

```typescript
@@filename(src/files/files.schemas)
import { z } from 'zod';

export const listFilesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
```

A client that knows the usage can warn before an upload is refused:

```typescript
@@filename(src/files/storage-usage.controller)
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { FilesService } from './files.service.js';

@Controller('me/storage')
export class StorageUsageController {
  constructor(private readonly filesService: FilesService) {}

  // Bytes used and allowed, so a client can warn before an upload is refused.
  @Get()
  usage(@CurrentUser('id') userId: string) {
    return this.filesService.usage(userId);
  }
}
```

#### Download files

Downloads go through the service, which finds the file by its id and its owner, so someone else's file is a 404, the same answer as a file that doesn't exist. There are two ways to hand the file over:

```typescript
@@filename(src/files/files.service)
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { serveFile, StorageDisk, type StoredUpload } from '@nestjs/storage';
// ...

  /** Streams the file as the response, with its type, length and name. */
  async content(ownerId: string, id: string, req: NodeRequest, res: NodeResponse) {
    const { key, name } = await this.stored(ownerId, id);
    return serveFile(this.disk, key, { req, res, filename: name });
  }

  /** A link that downloads the file without a token, for the next five minutes. */
  async link(ownerId: string, id: string) {
    const { key, name } = await this.stored(ownerId, id);
    const url = await this.disk.signedUrl(key, { expiresIn: '5m', filename: name });
    return { url, expiresIn: 300 };
  }
  // ...

  private async stored(ownerId: string, id: string) {
    const [file] = await this.db
      .select({ key: files.key, name: files.name })
      .from(files)
      .where(this.owned(ownerId, id));
    return file ?? notFound();
  }
  // ...
}
```

- **`content()` streams the file through the API.** `serveFile()` returns a `StreamableFile` of the disk's stream, so the file never sits in memory whole, with `Content-Type` (the detected type), `Content-Length`, `Content-Disposition: attachment` with the file's original name, `ETag`, `Cache-Control: private`, so no shared cache keeps one user's file, and `X-Content-Type-Options: nosniff`, so the browser never second-guesses the type. It answers `Range` requests with `206`, which lets a download resume. See [File storage](/application/file-storage#upload-product-photos) for the details, and [Response headers](/http/file-upload#response-headers) for `StreamableFile` itself.
- **`link()` returns a signed URL**, which downloads the file without a token for the next five minutes. A web page can put it in a link or an `<img>` tag, which can't send an `Authorization` header, and with S3 the download doesn't pass through the API at all. Anyone who holds the link can use it until it expires, and it can't be revoked, so keep it short-lived. The owner is checked when the link is issued; the link itself needs no check.
- **The original name is the client's**, stored as it came, without control characters. It's only ever sent back as the download's name: `serveFile()` puts it in `Content-Disposition` with an ASCII fallback, and `filename*` for the rest.

With S3, the signed links point at the bucket, which verifies them itself. With the local disk, they point at the application, which needs a route that verifies them and serves the file:

```typescript
@@filename(src/files/downloads.controller)
import { Controller, Get, Req, Res } from '@nestjs/common';
import { Public } from '@nestjs/authentication';
import type { NodeRequest, NodeResponse } from '@nestjs/platform-node';
import { serveSignedUrl, StorageDisk } from '@nestjs/storage';
import { ApiSecurity } from '@nestjs/swagger';

/**
 * Serves the local disk's signed links. They carry their own permission, so the route is
 * public. With S3, the links point at the bucket, and this route answers 404.
 */
@Public()
@ApiSecurity({})
@Controller('downloads')
export class DownloadsController {
  constructor(private readonly disk: StorageDisk) {}

  @Get()
  download(@Req() req: NodeRequest, @Res({ passthrough: true }) res: NodeResponse) {
    return serveSignedUrl(this.disk, { req, res });
  }
}
```

The route is `@Public()`: the authentication guard would otherwise ask for a token, and the link's signature is the permission. `serveSignedUrl()` checks the signature and the expiry, and answers `403` for a link that was changed or has expired.

```typescript
@@filename(src/files/files.module)
import { Module } from '@nestjs/common';
import { DownloadsController } from './downloads.controller.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';
import { StorageUsageController } from './storage-usage.controller.js';

@Module({
  controllers: [FilesController, StorageUsageController, DownloadsController],
  providers: [FilesService],
})
export class FilesModule {}
```

#### Delete files

A file is a row and some bytes, in two systems that can't share a transaction. One of them goes first, and whichever it is, a crash between the two leaves something behind:

- **Bytes first, then the row:** a crash leaves a row whose bytes are gone. The user sees the file in their list, and its download fails.
- **The row first, then the bytes:** a crash leaves bytes that no row points to, an **orphan**. The user sees nothing wrong; the cost is storage.

So the row goes first:

```typescript
@@filename(src/files/files.service)
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
// ...

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  // ...

  async remove(ownerId: string, id: string): Promise<void> {
    // The row first, and the quota with it, in one transaction.
    const { key } = await this.db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(files)
        .where(this.owned(ownerId, id))
        .returning({ key: files.key, size: files.size });
      if (!deleted) {
        notFound();
      }
      await tx
        .update(users)
        .set({ storageUsed: sql`${users.storageUsed} - ${deleted.size}` })
        .where(eq(users.id, ownerId));
      return deleted;
    });
    // Then the bytes. If this fails, they're an orphan, which the cleanup job removes;
    // the file is gone for the user either way.
    try {
      await this.disk.delete(key);
    } catch (error) {
      this.logger.warn(`Could not delete ${key}: ${String(error)}`);
    }
  }
  // ...
}
```

The row and the usage change in one transaction, and the bytes are deleted once it has committed. Two `DELETE` requests for the same file don't free its space twice: the second one's `DELETE` waits for the first transaction's lock on the row, then finds nothing, and answers 404. If deleting the bytes fails, the request still succeeds, since the file is gone for the user, and the bytes become an orphan.

Orphans come from three places: a process that stops between storing an upload and recording it, a failed delete of the bytes, and a deleted user, whose rows the foreign key's `ON DELETE CASCADE` removes but whose bytes it can't. A cleanup job removes them. Once a day, it lists the disk with `listAll()`, which returns each file's `key` and `lastModified`, looks the keys up in the `files` table in batches, and deletes the files that have no row and are more than an hour old. The age keeps it away from uploads that are stored but not recorded yet. Run it with [`@nestjs/schedule`](/application/task-scheduling), on one instance at a time with [`@nestjs/locks`](/reliability/locks#run-each-job-on-one-instance). When a user deletes their account, the keys start with their id, so `listAll()` with that `prefix` finds their files right away.

#### Use S3 in production

In production, the disk is a bucket. Only the environment changes: every service, controller and signed link keeps working. `S3Disk` reads its credentials from the standard `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` variables. For AWS S3:

```bash
STORAGE_DRIVER=s3
S3_BUCKET=files-api-production
S3_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

For an S3-compatible store, add `S3_ENDPOINT`: `https://<account id>.r2.cloudflarestorage.com` with `S3_REGION=auto` for Cloudflare R2, or a MinIO server's URL with `S3_FORCE_PATH_STYLE=true`. A missing setting stops the application at startup, before it accepts an upload:

```bash
$ STORAGE_DRIVER=s3 npm run start
ERROR [ExceptionHandler] Error: Config validation error: S3_BUCKET: Required when STORAGE_DRIVER is s3
$ STORAGE_DRIVER=s3 S3_BUCKET=files-api-production npm run start
ERROR [ExceptionHandler] TypeError: S3Disk needs credentials: pass `credentials: { accessKeyId, secretAccessKey }` (or a function returning them), or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

With the S3 disk, `GET /files/:id/link` returns a presigned URL to the bucket, which expires after 300 seconds and carries the download's name, and the application's `/downloads` route answers 404 (here for a store at `localhost:9000`, bucket `files-dev`, path-style):

```json
{"url":"http://localhost:9000/files-dev/d4614e84-dc0c-4539-a0af-3c7131b2a11a/dae1b7a8-0e79-429e-9c69-e572cdf20174.png?response-content-disposition=attachment%3B%20filename%3D%22avatar2.png%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20261119T224101Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=0323f9039100...","expiresIn":300}
```

When the bucket can't be reached, an upload fails with a 500, and nothing is recorded.

Uploads stream to S3 as they do to the folder: a file up to 8 MiB goes up in one request, and a longer one, or a stream whose length isn't known up front, as a multipart upload, which is aborted if anything fails, so a failed upload never becomes a file. `S3Disk` talks to S3 over `fetch`, with Signature Version 4 from `node:crypto`, so there's no AWS SDK to install. See [Use S3 or R2 in production](/application/file-storage#use-s3-or-r2-in-production) for retries, timeouts and the other services.

#### Try it

Start the application:

```bash
$ npm run start
```

Sign up, and keep the access token (tokens and long values are shortened here and below):

```bash
$ curl localhost:3000/auth/sign-up --json '{"email":"ada@example.com","password":"correct horse battery"}'
{"accessToken":"eyJhbGciOiJIUzI1NiIs...","refreshToken":"...","expiresIn":900}
$ ADA="Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Upload an image, from a directory with an `avatar.png` (and a copy, `avatar2.png`), a small PDF named `Rechnung März "Q1".pdf`, a `notes.txt` and an 11 MiB `video.png`. The text file declared as an image is refused, and so is the file over 10 MiB, and neither is stored:

```bash
$ curl localhost:3000/files -H "$ADA" -F file=@avatar.png
{"id":"e48f0fb4-2033-43e3-82d7-0070d56aac80","name":"avatar.png","contentType":"image/png","size":80,"createdAt":"2026-11-19T22:32:19.415Z"}
$ curl localhost:3000/files -H "$ADA" -F 'file=@notes.txt;type=image/png'
{"message":"File type not allowed. Allowed types: image/jpeg, image/png, image/webp, image/gif, application/pdf","error":"Unsupported Media Type","statusCode":415}
$ curl localhost:3000/files -H "$ADA" -F file=@video.png
{"message":"File too large","error":"Payload Too Large","statusCode":413}
```

Upload a PDF with a name that isn't plain ASCII, and list the files, newest first:

```bash
$ curl localhost:3000/files -H "$ADA" -F 'file=@Rechnung März "Q1".pdf'
{"id":"c45d329d-3130-47b6-bf1e-07b5a5d4cb50","name":"Rechnung März \"Q1\".pdf","contentType":"application/pdf","size":30,"createdAt":"2026-11-19T22:32:19.517Z"}
$ curl localhost:3000/files -H "$ADA"
[{"id":"c45d329d-3130-47b6-bf1e-07b5a5d4cb50","name":"Rechnung März \"Q1\".pdf",...},{"id":"e48f0fb4-2033-43e3-82d7-0070d56aac80","name":"avatar.png",...}]
```

Download the image through the API, and look at the headers. The PDF's name gets an ASCII fallback, and the exact name in `filename*`. A range request gets a `206`:

```bash
$ curl -sD - -o avatar-copy.png localhost:3000/files/e48f0fb4-2033-43e3-82d7-0070d56aac80/content -H "$ADA" | grep -iE '^(HTTP|content-|cache-control|x-content|etag)'
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
ETag: "50-660a8b34ff823"
Cache-Control: private
Content-Type: image/png
Content-Disposition: attachment; filename="avatar.png"
Content-Length: 80
$ curl -sD - -o /dev/null localhost:3000/files/c45d329d-3130-47b6-bf1e-07b5a5d4cb50/content -H "$ADA" | grep -i content-disposition
Content-Disposition: attachment; filename="Rechnung M_rz _Q1_.pdf"; filename*=UTF-8''Rechnung%20M%C3%A4rz%20%22Q1%22.pdf
$ curl -s -o /dev/null -w '%{http_code}\n' -r 0-7 localhost:3000/files/e48f0fb4-2033-43e3-82d7-0070d56aac80/content -H "$ADA"
206
```

Get a signed link, and download the file with it, without a token. A changed link is refused:

```bash
$ curl localhost:3000/files/e48f0fb4-2033-43e3-82d7-0070d56aac80/link -H "$ADA"
{"url":"http://localhost:3000/downloads?key=d4614e84-dc0c-4539-a0af-3c7131b2a11a%2F8758a3d5-f18a-4cc2-a65c-970825c0de30.png&expires=1795127846&disposition=attachment%3B+filename%3D%22avatar.png%22&signature=PgRNmG5AH1hf...","expiresIn":300}
$ LINK="http://localhost:3000/downloads?key=...&signature=PgRNmG5AH1hf..."
$ curl -sD - -o /dev/null "$LINK" | grep -iE '^(HTTP|content-)'
HTTP/1.1 200 OK
Content-Type: image/png
Content-Disposition: attachment; filename="avatar.png"
Content-Length: 80
$ curl "${LINK/avatar/secret}"
{"message":"Invalid signed URL","error":"Forbidden","statusCode":403}
```

A second user who signs up, with their token in `BOB`, gets a 404 for Ada's file, whether they ask for it, its content or a link:

```bash
$ curl localhost:3000/files/e48f0fb4-2033-43e3-82d7-0070d56aac80/link -H "$BOB"
{"message":"File not found","error":"Not Found","statusCode":404}
```

Give Ada a quota of 200 bytes, and fill it. Deleting a file gives its space back, but not enough for another 80 bytes:

```bash
$ docker exec files-db psql -U postgres -d files -c "UPDATE users SET storage_quota = 200 WHERE email = 'ada@example.com'"
$ curl localhost:3000/files -H "$ADA" -F file=@avatar2.png
{"id":"19b1b81b-7513-4dd2-b116-c1f556deb190","name":"avatar2.png","contentType":"image/png","size":80,"createdAt":"2026-11-19T22:32:36.780Z"}
$ curl localhost:3000/me/storage -H "$ADA"
{"used":190,"quota":200}
$ curl -i -X DELETE localhost:3000/files/c45d329d-3130-47b6-bf1e-07b5a5d4cb50 -H "$ADA"
HTTP/1.1 204 No Content
$ curl localhost:3000/me/storage -H "$ADA"
{"used":160,"quota":200}
$ curl localhost:3000/files -H "$ADA" -F file=@avatar2.png
{"message":"Storage quota exceeded","error":"Conflict","statusCode":409}
```

The files are in `storage/`, one folder per user, under the keys the server chose. The refused uploads left nothing behind:

```bash
$ find storage -type f
storage/d4614e84-dc0c-4539-a0af-3c7131b2a11a/dae1b7a8-0e79-429e-9c69-e572cdf20174.png
storage/d4614e84-dc0c-4539-a0af-3c7131b2a11a/8758a3d5-f18a-4cc2-a65c-970825c0de30.png
```

#### Test it

The guarantees that matter here are about concurrency, and an in-process database such as PGlite has a single connection, where requests never truly race. So the tests run against a real PostgreSQL server, through a connection pool, as in the [e-commerce tutorial](/tutorials/ecommerce-backend#test-it). The files go to an `InMemoryDisk`, which behaves like the other disks and lets the test see what's stored, with `keys()`. Overriding `STORAGE_MODULE_OPTIONS` replaces what the factory would have returned (see [Testing](/application/file-storage#testing)). The configuration still needs a signing key, so add one to the test environment:

```typescript
@@filename(vitest.config.e2e)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    env: {
      DATABASE_URL: 'postgres://unused-in-tests',
      JWT_SECRET: 'test-only-jwt-secret-of-at-least-32-bytes',
      STORAGE_SIGNING_KEY: 'test-only-signing-key-0123456789abcdef',
    },
  },
});
```

`app.inject()` sends a request body as it is given, so the test builds its multipart bodies with the platform's `FormData`, through a `Request`, which encodes it and picks the boundary:

```typescript
@@filename(test/files.e2e-spec)
import { fileURLToPath } from 'node:url';
import { PasswordHasher } from '@nestjs/authentication';
import { getDrizzleToken } from '@nestjs/drizzle';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { InMemoryDisk, STORAGE_MODULE_OPTIONS } from '@nestjs/storage';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../src/app.module.js';
import { files, users } from '../src/database/schema.js';

// A real PostgreSQL with a pool, so concurrent uploads really race.
const url = process.env.TEST_DATABASE_URL;

/** A file that starts like a PNG, padded to `size` bytes. */
const png = (size: number) =>
  Buffer.concat([Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'), Buffer.alloc(size - 16)]);

/** A multipart/form-data body, built by the platform's FormData. */
async function form(content: Buffer, filename: string, type = 'application/octet-stream') {
  const body = new FormData();
  body.append('file', new Blob([content], { type }), filename);
  const req = new Request('http://localhost/', { method: 'POST', body });
  return {
    payload: Buffer.from(await req.arrayBuffer()),
    headers: { 'content-type': req.headers.get('content-type')! },
  };
}

describe.skipIf(!url)('Files API (e2e)', () => {
  const db = drizzle({ client: new Pool({ connectionString: url, max: 20 }) });
  const disk = new InMemoryDisk({
    signedUrls: { baseUrl: 'http://localhost:3000/downloads', keys: ['test-only-signing-key-0123456789abcdef'] },
  });
  let app: NestNodeApplication;

  beforeAll(async () => {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    await db.execute(sql`TRUNCATE users, refresh_tokens CASCADE`);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(db)
      // scrypt at the default cost takes 128 MiB and a few hundred ms per hash.
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      // The files go to memory: the test checks what the disk holds with keys().
      .overrideProvider(STORAGE_MODULE_OPTIONS)
      .useValue({ disks: { files: disk } })
      .compile();
    app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
    await app.init();
  });

  afterAll(() => app.close()); // closes the pool too
  beforeEach(() => disk.clear());

  let clients = 0;

  /** Signs a user up, and returns the headers that authenticate as them. */
  async function signUp(email: string) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password: 'correct horse battery' },
      // Sign-up is rate-limited per IP address: each user gets an address of their own.
      remoteAddress: `10.0.0.${++clients}`,
    });
    return { authorization: `Bearer ${res.json<{ accessToken: string }>().accessToken}` };
  }

  async function upload(headers: Record<string, string>, content: Buffer, filename: string, type?: string) {
    const body = await form(content, filename, type);
    return app.inject({ method: 'POST', url: '/files', headers: { ...headers, ...body.headers }, payload: body.payload });
  }

  it('uploads a file and streams it back with its type and name', async () => {
    const ada = await signUp('ada@example.com');
    const content = png(2048);

    const created = await upload(ada, content, 'avatar.png', 'image/png');
    expect(created.statusCode).toBe(201);
    const file = created.json<{ id: string }>();
    expect(file).toMatchObject({ name: 'avatar.png', contentType: 'image/png', size: 2048 });

    const download = await app.inject({ method: 'GET', url: `/files/${file.id}/content`, headers: ada });
    expect(download.statusCode).toBe(200);
    expect(download.headers['content-type']).toBe('image/png');
    expect(download.headers['content-disposition']).toBe('attachment; filename="avatar.png"');
    expect(download.rawPayload).toEqual(content);
  });

  it('refuses a file of the wrong type, or too large, and stores nothing', async () => {
    const ada = await signUp('ada-refused@example.com');

    // A text file that claims to be an image: the bytes decide.
    const text = await upload(ada, Buffer.from('<script>alert(1)</script>'), 'cat.png', 'image/png');
    expect(text.statusCode).toBe(415);
    const big = await upload(ada, png(10 * 1024 * 1024 + 1), 'big.png', 'image/png');
    expect(big.statusCode).toBe(413);

    expect(disk.keys()).toEqual([]);
    const usage = await app.inject({ method: 'GET', url: '/me/storage', headers: ada });
    expect(usage.json()).toMatchObject({ used: 0 });
  });

  it('never lets concurrent uploads exceed the quota', async () => {
    const ada = await signUp('ada-quota@example.com');
    await db.update(users).set({ storageQuota: 10_000 }).where(eq(users.email, 'ada-quota@example.com'));

    // Five uploads of 3,000 bytes at once, against 10,000 bytes of quota: three fit.
    const results = await Promise.all(Array.from({ length: 5 }, (_, i) => upload(ada, png(3_000), `${i}.png`)));

    expect(results.map((res) => res.statusCode).sort()).toEqual([201, 201, 201, 409, 409]);
    const usage = await app.inject({ method: 'GET', url: '/me/storage', headers: ada });
    expect(usage.json()).toEqual({ used: 9_000, quota: 10_000 });
    // The refused uploads' bytes were deleted again.
    expect(disk.keys()).toHaveLength(3);
  });

  it("answers 404 for someone else's file", async () => {
    const ada = await signUp('ada-owner@example.com');
    const bob = await signUp('bob@example.com');
    const { id } = (await upload(ada, png(100), 'avatar.png')).json<{ id: string }>();

    for (const path of [`/files/${id}`, `/files/${id}/content`, `/files/${id}/link`]) {
      expect((await app.inject({ method: 'GET', url: path, headers: bob })).statusCode).toBe(404);
    }
    expect((await app.inject({ method: 'DELETE', url: `/files/${id}`, headers: bob })).statusCode).toBe(404);
    expect(disk.keys()).toHaveLength(1);
  });

  it('downloads through a signed link, which works without a token', async () => {
    const ada = await signUp('ada-link@example.com');
    const { id } = (await upload(ada, png(100), 'avatar.png')).json<{ id: string }>();

    const { url: link } = (await app.inject({ method: 'GET', url: `/files/${id}/link`, headers: ada })).json<{ url: string }>();
    const { pathname, search } = new URL(link);
    const download = await app.inject({ method: 'GET', url: pathname + search });
    expect(download.statusCode).toBe(200);
    expect(download.rawPayload).toEqual(png(100));

    const tampered = await app.inject({ method: 'GET', url: pathname + search.replace('avatar', 'secret') });
    expect(tampered.statusCode).toBe(403);
  });

  it('deletes the row, then the bytes, once even when asked twice at once', async () => {
    const ada = await signUp('ada-delete@example.com');
    const { id } = (await upload(ada, png(500), 'avatar.png')).json<{ id: string }>();

    const results = await Promise.all([1, 2].map(() => app.inject({ method: 'DELETE', url: `/files/${id}`, headers: ada })));

    expect(results.map((res) => res.statusCode).sort()).toEqual([204, 404]);
    const usage = await app.inject({ method: 'GET', url: '/me/storage', headers: ada });
    expect(usage.json()).toMatchObject({ used: 0 });
    expect(disk.keys()).toEqual([]);
    expect(await db.select().from(files).where(eq(files.id, id))).toEqual([]);
  });
});
```

Create a database for the tests, since they truncate the tables, and run both test files one after the other:

```bash
$ docker exec files-db psql -U postgres -c "CREATE DATABASE files_test"
$ TEST_DATABASE_URL=postgres://postgres:files@localhost:5432/files_test npm run test:e2e -- --no-file-parallelism

 Test Files  2 passed (2)
      Tests  11 passed (11)
```

The second file is the JWT tutorial's [refresh-token store test](/tutorials/rest-api-jwt-authentication#test-it), unchanged. Both truncate tables of the same database, hence `--no-file-parallelism`.

Replace the quota `UPDATE` in `create()` with a read, a check in JavaScript and a write, and "never lets concurrent uploads exceed the quota" fails: all five uploads get a 201.

#### Production checklist

Everything in the JWT tutorial's [checklist](/tutorials/rest-api-jwt-authentication#production-checklist) applies. For the files in particular:

- **Set `STORAGE_DRIVER` to `s3`.** Files on a container's disk are gone at the next deploy, and the other instances can't read them. The storage module logs a warning at startup when it finds a local disk with `NODE_ENV=production`.
- **Keep the bucket private.** Every download goes through the API or a signed link, so the bucket needs no public access at all. Grant the application `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` and `s3:ListBucket` on it, and nothing else. Without `s3:ListBucket`, S3 answers a request for a missing file with `403` instead of `404`.
- **Abort incomplete multipart uploads.** A lifecycle rule on the bucket that aborts them after a day removes the parts a crashed upload left behind. The cleanup job removes the orphans that are complete files.
- **Raise the request timeout for large files.** The Node adapter keeps Node's default `requestTimeout` of 300 seconds (see [Server timeouts](/http/performance#server-timeouts)): a 10 MiB upload on a slow mobile connection fits, a 1 GB one may not. A proxy in front of the API usually has a body size limit of its own, too.
- **Never serve uploads from your API's origin inline.** `serveFile()` sends `attachment` unless you ask for `inline`, and then only for types that can't run script, with `nosniff`. Keep it that way: an uploaded HTML or SVG file, shown inline, runs with your site's cookies.
- **Keep links short-lived.** Five minutes is plenty for a link that a page uses right away. For the local disk in development and CI, keep the signing key in a secret, and rotate it by putting the new key first in `keys`.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then records outbound `fetch` calls as spans, nested under the method that made them, next to the SQL statements (see [Database queries and outbound HTTP](/observability/sdk#database-queries-and-outbound-http)). `S3Disk` uses `fetch`, so a slow upload shows whether it waited on S3 or on PostgreSQL.

The [file storage chapter's checklist](/application/file-storage#production-checklist) covers public files behind a CDN, encryption with your own KMS key, and CORS for uploads from a browser.

#### What's next

- Let clients upload large files straight to the bucket, with a signed upload URL, and record them afterwards: [Upload straight to storage from the mobile app](/application/file-storage#upload-straight-to-storage-from-the-mobile-app).
- Accept CSV files and other formats without a signature: [Accept CSV and other text formats](/application/file-storage#accept-csv-and-other-text-formats).
- Run the orphan cleanup on a schedule, on one instance: [Task scheduling](/application/task-scheduling) and [Distributed locks](/reliability/locks).
- Share files between users, with permissions checked per file: [Authorization](/security/authorization).
- See slow uploads in production, request by request: [Observability](/observability/overview).
