### Build a CRUD REST API with Node.js and MongoDB

Build a CRUD REST API with Node.js and MongoDB in TypeScript, with NestJS and Mongoose: validated input, pagination, and updates that are never lost.

The API manages a product catalog: create a product, list the catalog page by page, read one, change some of its fields, delete it. Most of that is short. This tutorial spends its time on the parts that usually go wrong: a malformed id that becomes a 500, a duplicate SKU that does the same, a query operator smuggled into a filter, a list that repeats or skips products between pages, and two people who edit the same product at once and overwrite each other.

By the end, the API will:

- Store products in MongoDB through [`@nestjs/mongoose`](/data/mongodb), with `id` instead of `_id` and `__v` in every response.
- Validate every request body, query string and route parameter with [Zod](https://zod.dev/) schemas, which also refuse query operators such as `$gt` wherever a value is expected.
- Answer 400 for a malformed ObjectId, 404 for an unknown one, and 409 for a duplicate SKU.
- Update only the fields a request sends, and refuse an update made from a stale copy, with a version number.
- Page through the catalog with a cursor, filtered by category, price and stock, in one of the sorts it has an index for.
- Refuse to start when its configuration is invalid, or when the unique index it relies on is missing or can't be built.
- Send security headers, accept browser requests only from the origins you list, describe itself in an OpenAPI document, answer health checks, and write JSON logs in production.
- Prove the concurrency guarantees in tests against a real MongoDB server.

These are the endpoints, and the section that adds each one:

| Endpoint | Section |
| --- | --- |
| `POST /products`, `GET /products/:id`, `PATCH /products/:id`, `DELETE /products/:id` | [Build the CRUD endpoints](/tutorials/mongodb-crud-api#build-the-crud-endpoints) |
| `GET /products` | [Paginate, filter and sort the list](/tutorials/mongodb-crud-api#paginate-filter-and-sort-the-list) |
| `GET /health/live`, `GET /health/ready` | [Add health checks](/tutorials/mongodb-crud-api#add-health-checks) |
| `GET /docs` | [Assemble the application](/tutorials/mongodb-crud-api#assemble-the-application) |

> info **Hint** The finished application is on GitHub as [nestjs/example-mongodb-crud-api](https://github.com/nestjs/example-mongodb-crud-api), with its tests and a CI workflow.

You need Node.js 22 or later, and Docker to run MongoDB locally. The API has no sign-in, so that the MongoDB parts stay in focus; [What's next](/tutorials/mongodb-crud-api#whats-next) links the tutorial that adds it.

#### Create the project

Create the project with the [Nest CLI](/cli/overview). `--minimal` generates an application whose code is one file, which this tutorial replaces. It also installs the [NestJS Observe SDK](/observability/sdk), `@nestjs/observe`, and wires it into that file; the application's own files keep it:

```bash
$ npm i -g @nestjs/cli
$ nest new products-api --minimal
$ cd products-api
```

Install the [Node adapter](/http/performance#node-adapter), which runs Nest directly on `node:http`, Zod, [`@nestjs/config`](/application/configuration), Mongoose with [`@nestjs/mongoose`](/data/mongodb), and the packages for the OpenAPI document and the health checks. The Express adapter that the CLI installed is no longer needed:

```bash
$ npm uninstall @nestjs/platform-express @types/express
$ npm i --save @nestjs/platform-node zod @nestjs/config @nestjs/mongoose mongoose @nestjs/swagger @nestjs/terminus
$ npm i --save-dev @nestjs/testing vitest vite
```

Start MongoDB in a container:

```bash
$ docker run -d --name catalog-db -p 27017:27017 mongo:8
```

Add its URI to a `.env` file in the project's root directory. `ConfigModule` loads the file at startup:

```bash
MONGODB_URI=mongodb://localhost:27017/catalog
```

The configuration is a Zod schema. `ConfigModule` validates the environment against it at startup, and the application refuses to start when a variable is missing or malformed:

```typescript
@@filename(src/config)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  // Not z.url(): a replica set's URI lists several hosts, which isn't a valid URL.
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\/.+/, 'Expected a mongodb:// or mongodb+srv:// URI'),
  // The browser origins allowed to call the API, comma-separated. None by default.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(z.url())),
});

export type Env = z.infer<typeof envSchema>;
```

`MONGODB_URI` isn't checked with `z.url()`: a replica set's connection string lists its hosts separated by commas, as in `mongodb://db1:27017,db2:27017/catalog`, which `z.url()` refuses.

The application will have these files:

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">common</div>
    <div class="children">
      <div class="item">duplicate-key.filter.ts</div>
    </div>
    <div class="item">health</div>
    <div class="children">
      <div class="item">health.controller.ts</div>
      <div class="item">health.module.ts</div>
    </div>
    <div class="item">products</div>
    <div class="children">
      <div class="item">product.schema.ts</div>
      <div class="item">products.controller.ts</div>
      <div class="item">products.module.ts</div>
      <div class="item">products.schemas.ts</div>
      <div class="item">products.service.ts</div>
    </div>
    <div class="item">app.module.ts</div>
    <div class="item">config.ts</div>
    <div class="item">create-indexes.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

#### Model products with Mongoose

With Mongoose, a schema describes the documents of a collection, and a model reads and writes them. `@nestjs/mongoose` builds the schema from a class with decorators (see [Model injection](/data/mongodb#model-injection)):

```typescript
@@filename(src/products/product.schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true, // createdAt and updatedAt, set by Mongoose on every write
  versionKey: false, // no __v: `version` below is the one clients see
  toJSON: {
    virtuals: true, // adds `id`, the ObjectId as a string
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
})
export class Product {
  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  category: string;

  // Money in integer cents: no floating-point rounding.
  @Prop({ required: true, min: 1 })
  price: number;

  @Prop({ required: true, min: 0 })
  stock: number;

  // Incremented by every update; a client sends back the one it read.
  @Prop({ required: true, default: 1 })
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);

// Two products can't share a SKU, however many requests race to create one.
ProductSchema.index({ sku: 1 }, { unique: true });
// One index per filter and sort the list allows, with _id last as the tiebreaker.
ProductSchema.index({ createdAt: -1, _id: -1 });
ProductSchema.index({ price: 1, _id: 1 });
ProductSchema.index({ category: 1, createdAt: -1, _id: -1 });
ProductSchema.index({ category: 1, price: 1, _id: 1 });
```

- **`id`, not `_id`.** The `toJSON` options add the `id` virtual, the ObjectId as a 24-character string, and remove `_id`. Nest serializes a returned document with `JSON.stringify()`, which calls its `toJSON()`, so every response that contains a product has `id`.
- **No `__v`.** Mongoose's own version key only changes in `save()`, and by default only when an array changes. The API needs a version that changes on every update, in the same statement, so it keeps its own `version` field and turns `__v` off.
- **Prices are integers, in cents.** `19.99` can't be stored exactly as a floating-point number; `1999` can.
- **The indexes are declared in the schema.** The unique index on `sku` is what makes a duplicate SKU impossible: a check in your code can't, since two requests can both check before either writes. The other four serve the [list](/tutorials/mongodb-crud-api#paginate-filter-and-sort-the-list). Mongoose builds them when the application starts, unless its `autoIndex` option is off, which is what production wants (see [Create indexes in production](/tutorials/mongodb-crud-api#create-indexes-in-production)).

#### Validate requests with Zod

Every value that comes from the client goes through a schema before it reaches Mongoose. The request schemas:

```typescript
@@filename(src/products/products.schemas)
import { z } from 'zod';

// 24 hex characters: anything else would make Mongoose throw a CastError, a 500.
export const objectId = z.string().regex(/^[0-9a-f]{24}$/, 'Invalid ObjectId');

// Upper-cased, so `kb-001` and `KB-001` are the same SKU to the unique index.
const sku = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{3,32}$/, 'Expected 3 to 32 letters, digits or dashes')
  .toUpperCase();
const name = z.string().trim().min(1).max(200);
const description = z.string().max(5_000);
const category = z.string().trim().toLowerCase().min(1).max(50);
// In cents: 1999 is 19.99.
const price = z.number().int().positive().max(10_000_000);
const stock = z.number().int().min(0);

export const createProductSchema = z.object({
  sku,
  name,
  description: description.default(''),
  category,
  price,
  stock,
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

// Every field optional, none nullable, plus the version the client read.
// Built from the field schemas: createProductSchema.partial() would keep
// the description's default, and clear it on every update.
export const updateProductSchema = z
  .object({ sku, name, description, category, price, stock })
  .partial()
  .extend({ version: z.number().int().positive() })
  .refine((dto) => Object.keys(dto).length > 1, 'Nothing to update');
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
```

`StandardSchemaValidationPipe`, registered globally later, validates every parameter that declares a `schema`, and passes the schema's output to the handler: trimmed strings, an upper-cased SKU, a lower-cased category, the description's default. Each schema's inferred type is the parameter's type, so there are no DTO classes (see [Schema-based validation](/application/validation#schema-based-validation)).

##### Validate MongoDB ObjectIds

Mongoose converts a route's id to an ObjectId when it builds the query, and when the string isn't one, it throws a `CastError`, which reaches the client as a 500 Internal Server Error: the server is broken, it says, when the request was. The `objectId` schema answers 400 Bad Request instead, before any query runs. A valid id that matches no product is a 404 Not Found: the request was fine, the product isn't there.

> info **Hint** `@nestjs/mongoose` also exports a `ParseObjectIdPipe` and an `IsObjectIdPipe`, which answer 400 for an invalid id too. The schema keeps every parameter on the same mechanism, and documents the id's pattern in the OpenAPI document.

##### Refuse NoSQL operator injection

MongoDB queries are objects, and a JSON body can carry objects. If the body's `version` reached the update's filter as it came, a client could send this:

```json
{ "stock": 0, "version": { "$gte": 0 } }
```

The filter would match any version, and the check that prevents [lost updates](/tutorials/mongodb-crud-api#prevent-lost-updates-with-a-version) would let a stale write through. The schemas are the defense: `version` must be a number and `name` a string, so an object where a value belongs is a 400 before any query is built. Unknown properties, such as a top-level `$where`, are stripped by `z.object()` (see [Unknown properties](/application/validation#unknown-properties)). And the service builds each filter itself, field by field, from validated values: it never hands a request body or query object to Mongoose.

> info **Hint** Mongoose's `sanitizeFilter` option is a second line of defense: it wraps any object with a `$` key that appears in a filter in `$eq`, so it matches literally. Your own operators then need to be marked with `mongoose.trusted()`. With every value validated by a schema, this tutorial doesn't need it.

#### Build the CRUD endpoints

The service does the reads and writes, with the model that `@InjectModel()` injects:

```typescript
@@filename(src/products/products.service)
import { ConflictException, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Product, type ProductDocument } from './product.schema.js';
import type { CreateProductDto, UpdateProductDto } from './products.schemas.js';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(@InjectModel(Product.name) private readonly productModel: Model<Product>) {}

  async onModuleInit() {
    // In development and tests, the model arrives with its indexes built (waitForModelInit in AppModule).
    // With autoIndex off (production), a release step builds them: refuse to start if it didn't.
    const { toCreate } = await this.productModel.diffIndexes();
    if (toCreate.length > 0) {
      throw new Error(`Missing indexes on products: ${JSON.stringify(toCreate)}. Run npm run db:indexes.`);
    }
  }

  create(dto: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create(dto);
  }

  async findOne(id: string): Promise<ProductDocument> {
    return (await this.productModel.findById(id)) ?? notFound();
  }

  async update(id: string, { version, ...changes }: UpdateProductDto): Promise<ProductDocument> {
    // One conditional statement: it matches only while the product is still at the
    // version the client read, and $set writes only the fields the client sent.
    const product = await this.productModel.findOneAndUpdate(
      { _id: id, version },
      { $set: changes, $inc: { version: 1 } },
      { returnDocument: 'after', runValidators: true },
    );
    if (product) {
      return product;
    }
    // Nothing matched: either there's no such product, or someone changed it first.
    if (!(await this.productModel.exists({ _id: id }))) {
      notFound();
    }
    throw new ConflictException(`Product has changed since version ${version}`, { errorCode: 'VERSION_CONFLICT' });
  }

  async remove(id: string): Promise<void> {
    const { deletedCount } = await this.productModel.deleteOne({ _id: id });
    if (deletedCount === 0) {
      notFound();
    }
  }

  // list() follows in the next section.
}

function notFound(): never {
  throw new NotFoundException('Product not found');
}
```

- **`onModuleInit()` checks the indexes.** `diffIndexes()` compares the schema's indexes with the collection's, and the application refuses to start if one is missing. It matters in production, where Mongoose builds no index and [a release step](/tutorials/mongodb-crud-api#create-indexes-in-production) does. Elsewhere, Mongoose has already built them by the time the service is created, since the connection's `waitForModelInit` option waits for the build (see [Assemble the application](/tutorials/mongodb-crud-api#assemble-the-application)).
- **`findOne()` answers 404** when `findById()` finds nothing. The id was already validated, so this is the "valid but unknown" case.
- **`remove()` checks `deletedCount`**, from the same statement that deletes, rather than reading the product first.

##### Update only the fields the client sent

`update()` sends one `findOneAndUpdate()` with `$set`. Zod leaves out the fields the client didn't send, so `$set` writes the fields it did send and no other: a `PATCH` that changes the price leaves the name, the description and the stock as they are, however they changed in the meantime. Three things would break that:

- **Saving a whole document.** Reading the product, merging the body into it and calling `save()` or `replaceOne()` writes back every field it read, including those another request changed since.
- **A default in the update schema.** `createProductSchema.partial()` would keep `description`'s `.default('')`, and clear the description on every `PATCH` that doesn't send one.
- **A nested object in `$set`.** `$set` replaces a field's whole value: for a `dimensions` object, a `PATCH` with only its `width` would remove its `height`. Set one property of a nested object with a dotted path, `'dimensions.width'`.

A `null` field is a 400 rather than a stored `null`, and so is an update with nothing to update. `runValidators: true` makes Mongoose apply the schema's own rules, such as `min: 0` on `stock`, to updates too; without it, it checks them only on `create()` and `save()`.

##### Prevent lost updates with a version

Ada and Bob both open the keyboard's edit form, at version 1. Ada changes the price; a minute later, Bob saves the copy he still has. Without a version, both requests succeed, and if Bob's form sends every field, Ada's price is gone. So every update says which version it was made from. The update's filter matches the product's `_id` and the `version` the client sent, and the same statement increments `version`. MongoDB applies the filter and the update to a document atomically, so of two updates made from version 1, exactly one finds the product at version 1. The other changes nothing, and the service answers 409 Conflict, which tells the client to read the product again and let the user decide. A second query tells that case apart from a product that doesn't exist (404). The 409 carries an `errorCode`, so a client can tell it from a duplicate SKU without parsing the message (see [Machine-readable error codes](/exception-filters#machine-readable-error-codes)).

This is optimistic concurrency: nothing is locked while a user looks at a form. Mongoose's `optimisticConcurrency` schema option does the same for `save()` only, which reads the document and then writes it, in two round trips; the conditional update needs one. The [test](/tutorials/mongodb-crud-api#test-it) at the end sends ten updates of the same version at once, and checks that exactly one is applied.

#### Paginate, filter and sort the list

`GET /products` returns a page of the catalog, with a default page size and a cap, so no request reads the whole collection. The rest of the request schemas:

```typescript
@@filename(src/products/products.schemas)
// ...

// The cursor is opaque to the client, but it's client input all the same: it's
// decoded and validated like the rest of the query, before it reaches a filter.
const cursor = z
  .base64url()
  .max(200)
  .transform((value, ctx) => {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid cursor' });
      return z.NEVER;
    }
  })
  // The sort value (a price, or a creation time in milliseconds) and the _id of the page's last product.
  // Bounded: 1e300 is a number, but not a date MongoDB can compare with.
  .pipe(z.tuple([z.number().int().min(0).max(8.64e15), objectId]));

// Strict: an unknown or misspelled parameter is a 400, not an unfiltered list.
export const listProductsQuerySchema = z.strictObject({
  category: category.optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z.stringbool().optional(),
  // Only the sorts that have an index: see the schema.
  sort: z.enum(['-createdAt', 'price', '-price']).default('-createdAt'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: cursor.optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
```

The list pages with a **cursor**, not with `page` and `skip()`. `skip(n)` walks past `n` products before it returns any, so deep pages get slower, and a product created while someone reads page 1 shifts every later one, so page 2 repeats a product. A cursor names the last product of the page, and the next page starts after it. The client passes each page's `nextCursor` back as `cursor`, and stops when it's `null`.

- **The sort is a whitelist.** Each allowed sort has an index on its field, and one with `category` in front for a filtered list, so MongoDB reads one page of index entries however deep the page is. A sort on any other field would read and sort every matching product before returning the first. To add a sort, add its index first.
- **Every sort ends with `_id`.** Many products share a price, and without a tiebreaker their order isn't defined, so a page could repeat or skip one. `_id` is unique, so price and `_id` together are a total order, and the cursor holds both.
- **The cursor is client input.** It's base64url-encoded JSON, and nothing stops a client from sending its own. The schema decodes and validates it, so a crafted cursor with an operator object where the price belongs is a 400.
- **The query schema is strict.** `z.strictObject()` refuses parameters it doesn't declare, so a misspelled `?catgory=mice` is a 400 rather than an unfiltered catalog. The Node adapter's query parser keeps `?category[$ne]=x` as a parameter named `category[$ne]`, refused for the same reason; with a parser that builds nested objects, such as `qs`, it would be an object, which the string schema refuses.

The service's `list()` turns the query into a filter and a sort:

```typescript
@@filename(src/products/products.service)
import type { Model, QueryFilter } from 'mongoose';
import { Product, type ProductDocument } from './product.schema.js';
import type { CreateProductDto, ListProductsQuery, UpdateProductDto } from './products.schemas.js';

export interface ProductPage {
  items: ProductDocument[];
  /** Pass it back as `cursor` for the next page; `null` on the last one. */
  nextCursor: string | null;
}

// Each sort orders by _id last, so products with the same price keep a fixed order.
const sorts = {
  '-createdAt': { field: 'createdAt', direction: -1 },
  price: { field: 'price', direction: 1 },
  '-price': { field: 'price', direction: -1 },
} as const satisfies Record<ListProductsQuery['sort'], unknown>;

@Injectable()
export class ProductsService implements OnModuleInit {
  // ...

  async list({ category, minPrice, maxPrice, inStock, sort, limit, cursor }: ListProductsQuery): Promise<ProductPage> {
    const { field, direction } = sorts[sort];
    // Built field by field from validated values: no request object is ever spread into a filter.
    const filter: QueryFilter<Product> = {};
    if (category !== undefined) {
      filter.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = { $gte: minPrice ?? 0, $lte: maxPrice ?? Number.MAX_SAFE_INTEGER };
    }
    if (inStock !== undefined) {
      filter.stock = inStock ? { $gt: 0 } : 0;
    }
    if (cursor) {
      // The products after the cursor in sort order: a later sort value, or the same one and a later _id.
      const [lastValue, lastId] = cursor;
      const value = field === 'createdAt' ? new Date(lastValue) : lastValue;
      const after = direction === 1 ? '$gt' : '$lt';
      filter.$and = [
        { [field]: { [direction === 1 ? '$gte' : '$lte']: value } },
        { $or: [{ [field]: { [after]: value } }, { _id: { [after]: lastId } }] },
      ];
    }

    // One more than a page: if it comes back, there's a next page.
    const found = await this.productModel
      .find(filter)
      .sort({ [field]: direction, _id: direction })
      .limit(limit + 1);
    const items = found.slice(0, limit);
    const last = items.at(-1);
    const nextCursor =
      found.length > limit && last
        ? Buffer.from(JSON.stringify([+last[field], last.id])).toString('base64url')
        : null;
    return { items, nextCursor };
  }
}
```

For `sort=-price`, the cursor's condition reads "a lower price, or the same price and a lower `_id`". The outer `$lte` on the price lets MongoDB start its index scan at the cursor. `explain()` on a later page of `?category=mice&sort=-price&limit=5` shows the `category_1_price_1__id_1` index, no `SORT` stage, and 6 documents examined: the page, and the one extra product that tells `list()` there's a next page.

The controller maps the five routes to the service, with the schemas on their parameters:

```typescript
@@filename(src/products/products.controller)
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  createProductSchema,
  listProductsQuerySchema,
  objectId,
  updateProductSchema,
  type CreateProductDto,
  type ListProductsQuery,
  type UpdateProductDto,
} from './products.schemas.js';
import { ProductsService } from './products.service.js';

const productId = { schema: objectId };

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query({ schema: listProductsQuerySchema }) query: ListProductsQuery) {
    return this.productsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', productId) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body({ schema: createProductSchema }) dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', productId) id: string, @Body({ schema: updateProductSchema }) dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', productId) id: string) {
    return this.productsService.remove(id);
  }
}
```

`POST` answers `201 Created` by default, and `DELETE` sets `204 No Content`, since there's nothing to return. The products module registers the model, the controller and the service:

```typescript
@@filename(src/products/products.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

`MongooseModule.forFeature()` registers the model on the connection that `MongooseModule.forRootAsync()` opens in the root module, and makes it injectable with `@InjectModel(Product.name)`.

#### Answer 409 for duplicate keys

When an insert or an update would give two products the same SKU, MongoDB refuses it with a `MongoServerError` whose `code` is `11000`. Nest doesn't know that error, so the client gets a 500, which tells it nothing it can act on. It's a conflict with existing data, a 409, and an [exception filter](/exception-filters#inheritance) can say so for every collection at once:

```typescript
@@filename(src/common/duplicate-key.filter)
import { ConflictException, Catch, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { mongo } from 'mongoose';

const DUPLICATE_KEY = 11000;

/** A unique index refused the write: a 409 that names the field, rather than a 500. */
@Catch(mongo.MongoServerError)
export class DuplicateKeyFilter extends BaseExceptionFilter {
  catch(error: mongo.MongoServerError, host: ArgumentsHost) {
    if (error.code !== DUPLICATE_KEY) {
      // Any other database error is still a 500, and logged as one.
      return super.catch(error, host);
    }
    // keyValue holds the values the index refused, e.g. { sku: 'KB-001' }.
    const fields = Object.keys(error.keyValue ?? {});
    const message = `This ${fields.join(', ') || 'key'} is already taken`;
    super.catch(new ConflictException(message, { errorCode: 'DUPLICATE_KEY' }), host);
  }
}
```

- **It catches the `MongoServerError` of Mongoose's own copy of the driver**, `mongo` from `mongoose`, so the class is the one Mongoose throws.
- **Every other server error goes to `BaseExceptionFilter`**, which answers 500 and logs it, as without the filter. A filter that answered 409 for anything from MongoDB would hide real failures.
- **The message names the field, not the value**, which `keyValue` also holds: a message that echoes values would one day echo one it shouldn't.

The root module registers it with `APP_FILTER`, in a later section.

> info **Hint** A check before the insert, such as "is this SKU taken?", doesn't replace the index. Two requests can both check before either inserts, and both inserts succeed. The test at the end sends ten creates with the same SKU at once: the index lets one through.

#### Add health checks

A container platform asks two questions: is the process alive, and can it serve requests right now. [`@nestjs/terminus`](/reliability/terminus) answers both, and has an indicator for Mongoose, which pings the connection that `@nestjs/mongoose` opened (see [Other database indicators](/reliability/terminus#other-database-indicators)):

```typescript
@@filename(src/health/health.controller)
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb').withTimeout('1s')]);
  }
}
```

The health module imports Terminus, which provides `HealthCheckService` and `MongooseHealthIndicator`:

```typescript
@@filename(src/health/health.module)
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

The liveness check doesn't look at the database: a restart wouldn't repair it. The readiness check fails when MongoDB doesn't answer the ping within one second, and the platform stops sending traffic to the instance until it passes again.

#### Assemble the application

The root module opens the connection with the URI from the configuration, and registers the validation pipe and the filter for every route:

```typescript
@@filename(src/app.module)
import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';
import { DuplicateKeyFilter } from './common/duplicate-key.filter.js';
import { envSchema, type Env } from './config.js';
import { HealthModule } from './health/health.module.js';
import { ProductsModule } from './products/products.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // First, so it shuts down last and still sends what the other modules did.
    ObserveModule.forRoot({
      // Empty until `npx @nestjs/observe link` writes the key pair into .env: the SDK then sends nothing.
      appKey: process.env.OBSERVE_APP_KEY ?? '',
      appSecret: process.env.OBSERVE_APP_SECRET ?? '',
      serviceId: 'products-api',
    }),
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
        // How long a query waits for a reachable server before it fails (the driver's default is 30s).
        serverSelectionTimeoutMS: 5_000,
        // Builds the schemas' indexes at startup. Production builds them in a release step instead.
        autoIndex: config.get('NODE_ENV', { infer: true }) !== 'production',
        // Every model waits for its collection and indexes before it's injected.
        waitForModelInit: true,
      }),
    }),
    ProductsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_FILTER, useClass: DuplicateKeyFilter },
  ],
})
export class AppModule {}
```

- **`forRootAsync()`** reads the URI from `ConfigService`, after `ConfigModule` validated it, and closes the connection when the application shuts down (see [Async configuration](/data/mongodb#async-configuration)).
- **`serverSelectionTimeoutMS`** is how long an operation waits for a reachable MongoDB server. With the driver's default of 30 seconds, a request during an outage would hang that long before its 500; with five, it gets its 500 after five.
- **`autoIndex`** is on except in production, where [a release step](/tutorials/mongodb-crud-api#create-indexes-in-production) builds the indexes.
- **`waitForModelInit`** makes each model wait for `model.init()`, which creates the collection and builds the indexes, before it's injected. Without it, Mongoose builds them in the background: the application can serve requests before the unique index on `sku` exists, and if the collection already holds a duplicate SKU, the build fails without a log line and the application accepts duplicates from then on. With it, a failed build stops the startup with the MongoDB error. It needs `@nestjs/mongoose` 12.0.2 or later (see [Wait for indexes](/data/mongodb#wait-for-indexes)).
- **The pipe and the filter are providers** of `AppModule` rather than calls in `main.ts`, so the tests, which boot `AppModule` without `main.ts`, get them too.
- **`ObserveModule` comes first** in `imports`, as the [SDK's quick start](/observability/sdk#quick-start) does: modules shut down in reverse order, so it stops last, and sends what the others recorded (see [Shutdown](/observability/sdk#shutdown)). `createObserveModule()` returns it with `ObserveInstrument`, which `main.ts` passes to Nest.
- **The key pair is empty until you link the project.** Without one, the SDK sends nothing, and says so at startup. `npx @nestjs/observe link` writes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` into `.env`, and adds `--env-file .env` to the `start` script, so they're in the environment before `AppModule` is imported, when the SDK reads them (see [Linking from the terminal](/observability/sdk#linking-from-the-terminal)).

`main.ts` creates the application on the Node adapter, and adds what belongs at the edge of any API. With an adapter, the application options, `instrument` among them, are the third argument:

```typescript
@@filename(src/main)
import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';
import type { Env } from './config.js';

const production = process.env.NODE_ENV === 'production';
const app = await NestFactory.create<NestNodeApplication>(AppModule, new NodeAdapter(), {
  instrument: ObserveInstrument,
  // One JSON object per line in production; readable text in development.
  logger: new ConsoleLogger({ json: production }),
});
app.useSecurityHeaders();
app.enableShutdownHooks();

const config = app.get<ConfigService<Env, true>>(ConfigService);
app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }) });

const document = new DocumentBuilder().setTitle('Products API').setVersion('1.0').build();
SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, document));

await app.listen(config.get('PORT', { infer: true }));
```

- **JSON logs in production.** `ConsoleLogger` writes one JSON object per line when `NODE_ENV` is `production`, and readable text otherwise (see [JSON logging](/application/logger#json-logging)). It's created before `ConfigModule` reads `.env`, so it reads `NODE_ENV` from the process environment, where your platform sets it.
- **Security headers.** `app.useSecurityHeaders()` sends the headers [Helmet](https://helmetjs.github.io/) would, with its defaults, on every response, errors included (see [Security headers](/security/helmet)).
- **Shutdown hooks.** `enableShutdownHooks()` makes the application close on `SIGTERM`, which a container platform sends on every deploy: the server stops accepting connections, and `@nestjs/mongoose` closes the MongoDB connection.
- **CORS from the configuration.** No browser origin is allowed unless `CORS_ORIGINS` lists it. Called without an `origin`, `enableCors()` would answer every website with `Access-Control-Allow-Origin: *` (see [Default allowed origins](/security/cors#default-allowed-origins)).
- **An OpenAPI document.** [`@nestjs/swagger`](/openapi/introduction) builds it from the controllers, and takes the request bodies, query parameters and route parameters from the same Zod schemas that validate them (see [Standard Schema](/openapi/introduction#standard-schema-zod-valibot)). Swagger UI is at `http://localhost:3000/docs`, and the document at `http://localhost:3000/docs-json`.

The id parameter in the OpenAPI document, from `objectId`:

```json
{
  "name": "id",
  "required": true,
  "in": "path",
  "schema": {
    "type": "string",
    "pattern": "^[0-9a-f]{24}$"
  }
}
```

#### Try it

Start the application:

```bash
$ npm run start
```

Create a product. The response has `id` and `version`, and no `_id` or `__v`:

```bash
$ curl localhost:3000/products --json '{"sku":"kb-001","name":"Mechanical keyboard","description":"Hot-swappable switches","category":"Keyboards","price":12900,"stock":5}'
{"sku":"KB-001","name":"Mechanical keyboard","description":"Hot-swappable switches","category":"keyboards","price":12900,"stock":5,"version":1,"createdAt":"2026-11-23T18:54:18.607Z","updatedAt":"2026-11-23T18:54:18.607Z","id":"6b048bda3718dc2b670713ac"}
```

The same SKU in lower case is the same SKU, and the unique index refuses it. A value that's an object, as an operator injection would send, never reaches MongoDB:

```bash
$ curl localhost:3000/products --json '{"sku":"KB-001","name":"Compact keyboard","category":"keyboards","price":8900,"stock":3}'
{"message":"This sku is already taken","error":"Conflict","statusCode":409,"errorCode":"DUPLICATE_KEY"}
$ curl localhost:3000/products --json '{"sku":"KB-002","name":{"$gt":""},"category":"keyboards","price":8900,"stock":3}'
{"message":["name: Invalid input: expected string, received object"],"error":"Bad Request","statusCode":400}
```

A malformed id is the client's mistake, and a well-formed one that matches nothing is a missing product:

```bash
$ curl localhost:3000/products/not-an-id
{"message":["Invalid ObjectId"],"error":"Bad Request","statusCode":400}
$ curl localhost:3000/products/507f1f77bcf86cd799439011
{"message":"Product not found","error":"Not Found","statusCode":404}
```

Change the price from version 1. A second change from the same version 1, by a client that didn't see the first, is refused, and so is a version that's an operator:

```bash
$ curl -X PATCH localhost:3000/products/6b048bda3718dc2b670713ac --json '{"price":13900,"version":1}'
{"sku":"KB-001","name":"Mechanical keyboard","description":"Hot-swappable switches","category":"keyboards","price":13900,"stock":5,"version":2,"createdAt":"2026-11-23T18:54:18.607Z","updatedAt":"2026-11-23T18:54:29.338Z","id":"6b048bda3718dc2b670713ac"}
$ curl -X PATCH localhost:3000/products/6b048bda3718dc2b670713ac --json '{"stock":4,"version":1}'
{"message":"Product has changed since version 1","error":"Conflict","statusCode":409,"errorCode":"VERSION_CONFLICT"}
$ curl -X PATCH localhost:3000/products/6b048bda3718dc2b670713ac --json '{"stock":4,"version":{"$gte":0}}'
{"message":["version: Invalid input: expected number, received object"],"error":"Bad Request","statusCode":400}
```

Add four mice the same way, two of them at the same price, and page through them by price, two at a time. The second page starts after the cursor, which holds the last product's price and `_id`. Filters combine, and a sort or a parameter the schema doesn't declare is a 400 (`-g` stops curl from reading the brackets as a pattern):

```bash
$ curl 'localhost:3000/products?category=mice&sort=price&limit=2'
{"items":[{"sku":"MS-001","name":"Wired mouse",...,"price":1900,"stock":12,...,"id":"6b048bef3718dc2b670713ae"},{"sku":"MS-002","name":"Wireless mouse",...,"price":2900,"stock":0,...,"id":"6b048bef3718dc2b670713af"}],"nextCursor":"WzI5MDAsIjZiMDQ4YmVmMzcxOGRjMmI2NzA3MTNhZiJd"}
$ curl 'localhost:3000/products?category=mice&sort=price&limit=2&cursor=WzI5MDAsIjZiMDQ4YmVmMzcxOGRjMmI2NzA3MTNhZiJd'
{"items":[{"sku":"MS-003","name":"Vertical mouse",...,"price":2900,"stock":4,...,"id":"6b048bef3718dc2b670713b0"},{"sku":"MS-004","name":"Trackball",...,"price":4900,"stock":2,...,"id":"6b048bfc3718dc2b670713b1"}],"nextCursor":null}
$ curl 'localhost:3000/products?category=mice&inStock=true&maxPrice=3000'
{"items":[{"sku":"MS-003","name":"Vertical mouse",...,"price":2900,"stock":4,...},{"sku":"MS-001","name":"Wired mouse",...,"price":1900,"stock":12,...}],"nextCursor":null}
$ curl 'localhost:3000/products?sort=stock'
{"message":["sort: Invalid option: expected one of \"-createdAt\"|\"price\"|\"-price\""],"error":"Bad Request","statusCode":400}
$ curl -g 'localhost:3000/products?category[$ne]=mice'
{"message":["Unrecognized key: \"category[$ne]\""],"error":"Bad Request","statusCode":400}
```

Delete the product. A second delete finds nothing:

```bash
$ curl -i -X DELETE localhost:3000/products/6b048bda3718dc2b670713ac
HTTP/1.1 204 No Content
...
$ curl -X DELETE localhost:3000/products/6b048bda3718dc2b670713ac
{"message":"Product not found","error":"Not Found","statusCode":404}
```

When MongoDB stops answering, the readiness check fails within its one-second timeout, while the liveness check still passes:

```bash
$ curl localhost:3000/health/ready
{"status":"ok","info":{"mongodb":{"responseTime":5,"status":"up"}},"error":{},"details":{"mongodb":{"responseTime":5,"status":"up"}}}
$ docker pause catalog-db
$ curl -i localhost:3000/health/ready
HTTP/1.1 503 Service Unavailable
...
{"status":"error","info":{},"error":{"mongodb":{"message":"timeout of 1000ms exceeded","responseTime":1001,"status":"down"}},"details":{"mongodb":{"message":"timeout of 1000ms exceeded","responseTime":1001,"status":"down"}}}
$ curl localhost:3000/health/live
{"status":"ok","info":{},"error":{},"details":{}}
$ docker unpause catalog-db
```

#### Test it

The guarantees that matter here are about concurrency, so the tests run against a real MongoDB server, and send concurrent requests with `app.inject()`, which the Node adapter provides, so no server has to listen. They boot the real `AppModule` with one change: the connection is replaced with one to a database of the test file's own, which `createTestApp()` empties first:

```typescript
@@filename(test/test-app)
import { getConnectionToken } from '@nestjs/mongoose';
import { NodeAdapter, type NestNodeApplication } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import { createConnection } from 'mongoose';
import { AppModule } from '../src/app.module.js';

/**
 * The real AppModule, on a database of its own: `<database in TEST_MONGODB_URI>_<name>`,
 * emptied first. Each test file passes its own name, so files run in parallel.
 */
export async function createTestApp(name: string): Promise<NestNodeApplication> {
  const server = await createConnection(process.env.TEST_MONGODB_URI!).asPromise();
  const connection = server.useDb(`${server.name}_${name}`);
  await connection.dropDatabase();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(getConnectionToken())
    .useValue(connection)
    .compile();
  const app = moduleRef.createNestApplication<NestNodeApplication>(new NodeAdapter());
  // Closing the application closes the connection too.
  return app.init();
}
```

`useDb()` shares the first connection's pool, and closing the application closes both. Since each file has its own database, Vitest can run the files in parallel. The test configuration gives the application the environment it validates at startup; the URI is never used:

```typescript
@@filename(vitest.config.e2e)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    env: {
      // Validated at startup; the tests replace the connection with their own.
      MONGODB_URI: 'mongodb://unused-in-tests',
    },
  },
});
```

The first file covers the CRUD routes and what they refuse:

```typescript
@@filename(test/products.e2e-spec)
import type { NestNodeApplication } from '@nestjs/platform-node';
import { createTestApp } from './test-app.js';

const url = process.env.TEST_MONGODB_URI;

describe.skipIf(!url)('Products API (e2e)', () => {
  let app: NestNodeApplication;

  beforeAll(async () => {
    app = await createTestApp('products');
  });
  afterAll(() => app.close());

  const keyboard = {
    sku: 'kb-001',
    name: 'Mechanical keyboard',
    description: 'Hot-swappable switches',
    category: 'Keyboards',
    price: 12900,
    stock: 5,
  };

  async function create(payload: object) {
    const res = await app.inject({ method: 'POST', url: '/products', payload });
    expect(res.statusCode).toBe(201);
    return res.json<{ id: string; version: number }>();
  }

  it('creates, reads, updates and deletes a product, with `id` and no `_id` or `__v`', async () => {
    const created = await create(keyboard);
    expect(created).toMatchObject({ sku: 'KB-001', category: 'keyboards', version: 1 });
    expect(created).not.toHaveProperty('_id');
    expect(created).not.toHaveProperty('__v');

    const found = await app.inject({ method: 'GET', url: `/products/${created.id}` });
    expect(found.json()).toEqual(created);

    const updated = await app.inject({
      method: 'PATCH',
      url: `/products/${created.id}`,
      payload: { price: 13900, version: 1 },
    });
    expect(updated.statusCode).toBe(200);
    // Only the price changed: the fields the client didn't send are untouched.
    expect(updated.json()).toMatchObject({ ...created, price: 13900, version: 2, updatedAt: expect.any(String) });

    expect((await app.inject({ method: 'DELETE', url: `/products/${created.id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: `/products/${created.id}` })).statusCode).toBe(404);
  });

  it('answers 400 for a malformed id and 404 for an unknown one', async () => {
    for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
      const res = await app.inject({ method, url: '/products/not-an-id', payload: { stock: 1, version: 1 } });
      expect(res.statusCode).toBe(400);
    }
    const unknown = await app.inject({ method: 'GET', url: '/products/507f1f77bcf86cd799439011' });
    expect(unknown.statusCode).toBe(404);
    const unknownUpdate = await app.inject({
      method: 'PATCH',
      url: '/products/507f1f77bcf86cd799439011',
      payload: { stock: 1, version: 1 },
    });
    expect(unknownUpdate.statusCode).toBe(404);
  });

  it('answers 409 for a duplicate SKU, in any letter case, on create and on update', async () => {
    await create({ ...keyboard, sku: 'MS-001', name: 'Mouse' });
    const duplicate = await app.inject({ method: 'POST', url: '/products', payload: { ...keyboard, sku: 'ms-001' } });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toMatchObject({ errorCode: 'DUPLICATE_KEY' });

    const other = await create({ ...keyboard, sku: 'MS-002', name: 'Mouse 2' });
    const renamed = await app.inject({
      method: 'PATCH',
      url: `/products/${other.id}`,
      payload: { sku: 'MS-001', version: other.version },
    });
    expect(renamed.statusCode).toBe(409);
  });

  it('refuses query operators wherever a value is expected', async () => {
    const { id } = await create({ ...keyboard, sku: 'OP-001' });
    const attempts = [
      { method: 'POST', url: '/products', payload: { ...keyboard, sku: 'OP-002', name: { $gt: '' } } },
      // A version of { $gte: 0 } would match any version, and skip the stale-write check.
      { method: 'PATCH', url: `/products/${id}`, payload: { stock: 0, version: { $gte: 0 } } },
      { method: 'GET', url: '/products?category[$ne]=keyboards' },
      { method: 'GET', url: '/products?category=a&category=b' },
      { method: 'GET', url: `/products?cursor=${encode([{ $gt: 0 }, id])}` },
      { method: 'GET', url: `/products?cursor=${encode([1e300, id])}` },
      { method: 'GET', url: '/products?sort=stock' },
    ] as const;
    for (const attempt of attempts) {
      expect((await app.inject(attempt)).statusCode).toBe(400);
    }
    const product = await app.inject({ method: 'GET', url: `/products/${id}` });
    expect(product.json()).toMatchObject({ name: 'Mechanical keyboard', stock: 5, version: 1 });
  });

  it('refuses an update with nothing to update, or with a null field', async () => {
    const { id } = await create({ ...keyboard, sku: 'NU-001' });
    for (const payload of [{ version: 1 }, { name: null, version: 1 }, { price: 19.99, version: 1 }]) {
      expect((await app.inject({ method: 'PATCH', url: `/products/${id}`, payload })).statusCode).toBe(400);
    }
  });

  it('pages through a filtered list in every sort, without repeating or skipping a product', async () => {
    // Twelve mice at four prices: ties that only the _id tiebreaker orders.
    const ids = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const { id } = await create({ sku: `PG-${i}`, name: `Mouse ${i}`, category: 'mice', price: 1000 + (i % 4) * 500, stock: i % 3 });
      ids.add(id);
    }

    type Item = { id: string; price: number; createdAt: string };
    for (const [sort, key, sign] of [['-createdAt', 'createdAt', -1], ['price', 'price', 1], ['-price', 'price', -1]] as const) {
      const seen: Item[] = [];
      let cursor: string | null = null;
      do {
        const res = await app.inject({
          method: 'GET',
          url: `/products?category=mice&sort=${sort}&limit=5${cursor ? `&cursor=${cursor}` : ''}`,
        });
        expect(res.statusCode).toBe(200);
        const page: { items: Item[]; nextCursor: string | null } = res.json();
        seen.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);

      expect(seen.map((p) => p.id).sort()).toEqual([...ids].sort());
      expect(seen.every((p) => !('_id' in p))).toBe(true);
      const values = seen.map((p) => (key === 'price' ? p.price : Date.parse(p.createdAt)));
      expect(values).toEqual([...values].sort((a, b) => sign * (a - b)));
    }

    const inStock = await app.inject({ method: 'GET', url: '/products?category=mice&inStock=true&maxPrice=1500' });
    const items = inStock.json<{ items: { price: number; stock: number }[] }>().items;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((p) => p.stock > 0 && p.price <= 1500)).toBe(true);
  });
});

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
```

The second file sends concurrent writes. Ten updates made from the same version must produce exactly one change, and ten creates with the same SKU exactly one product:

```typescript
@@filename(test/concurrency.e2e-spec)
import type { NestNodeApplication } from '@nestjs/platform-node';
import { createTestApp } from './test-app.js';

const url = process.env.TEST_MONGODB_URI;

describe.skipIf(!url)('Concurrent writes (e2e)', () => {
  let app: NestNodeApplication;

  beforeAll(async () => {
    app = await createTestApp('concurrency');
  });
  afterAll(() => app.close());

  it('applies one of ten concurrent updates of the same version, and refuses the rest', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/products',
      payload: { sku: 'RACE-1', name: 'Desk mat', category: 'desk', price: 2500, stock: 10 },
    });
    const { id } = created.json<{ id: string }>();

    // Ten clients read version 1, and each sets a stock of its own.
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        app.inject({ method: 'PATCH', url: `/products/${id}`, payload: { stock: i, version: 1 } }),
      ),
    );

    const statuses = results.map((res) => res.statusCode);
    expect(statuses.sort()).toEqual([200, ...Array(9).fill(409)]);
    const winner = results.find((res) => res.statusCode === 200)!.json<{ stock: number }>();
    const product = (await app.inject({ method: 'GET', url: `/products/${id}` })).json();
    expect(product).toMatchObject({ version: 2, stock: winner.stock });
  });

  it('creates one of ten concurrent products with the same SKU', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: '/products',
          payload: { sku: 'race-2', name: `Lamp ${i}`, category: 'desk', price: 4900, stock: 1 },
        }),
      ),
    );
    expect(results.map((res) => res.statusCode).sort()).toEqual([201, ...Array(9).fill(409)]);
  });
});
```

Add a script to `package.json`:

```json
"test:e2e": "vitest run --config ./vitest.config.e2e.ts"
```

Run both files against the MongoDB container. Their databases are named after the URI's, here `catalog_test_products` and `catalog_test_concurrency`:

```bash
$ TEST_MONGODB_URI=mongodb://localhost:27017/catalog_test npm run test:e2e

 Test Files  2 passed (2)
      Tests  8 passed (8)
```

Remove `version` from the filter of `findOneAndUpdate()` in `update()`, and the first concurrency test fails: all ten updates succeed, each overwriting the one before. Drop the `_id` from the cursor's condition in `list()`, and the pagination test fails: products that share a price at a page boundary are skipped. Remove `waitForModelInit` from `AppModule`, and `onModuleInit()` can check the indexes while Mongoose is still building them: the application refuses to start, and both files fail before their first test.

#### Create indexes in production

Building an index reads the whole collection, and slows every other request while it runs. Mongoose's documentation recommends turning `autoIndex` off in production for that reason, which `AppModule` does when `NODE_ENV` is `production`. A release step builds the indexes instead, once per release, before the new version starts:

```typescript
@@filename(src/create-indexes)
import { createConnection } from 'mongoose';
import { envSchema } from './config.js';
import { Product, ProductSchema } from './products/product.schema.js';

// A release step: builds the indexes the schemas declare, before the new version starts.
const { MONGODB_URI } = envSchema.parse(process.env);
const connection = await createConnection(MONGODB_URI, { autoIndex: false }).asPromise();
try {
  // Creates the missing indexes and changes nothing else: unlike syncIndexes(), it never drops one.
  await connection.model(Product.name, ProductSchema).createIndexes();
  console.log('Indexes of products:', (await connection.collection('products').indexes()).map((index) => index.name));
} finally {
  await connection.close();
}
```

It's a plain Mongoose script, since `AppModule` would refuse to start without the very indexes it creates. `createIndexes()` adds the missing indexes; `syncIndexes()` would also drop the ones the schema doesn't declare, including any added by hand for a reason.

Add a script to `package.json`. `--env-file-if-exists` (Node.js 22.9 or later) reads `.env` in development, and changes nothing where the platform sets the environment:

```json
"db:indexes": "node --env-file-if-exists=.env dist/create-indexes.js"
```

A production start before the release step refuses to run, rather than accept duplicate SKUs without a unique index (the stack trace is shortened):

```bash
$ npm run build
$ NODE_ENV=production npm run start:prod
...
Error: Missing indexes on products: [{"sku":1},{"createdAt":-1,"_id":-1},{"price":1,"_id":1},{"category":1,"createdAt":-1,"_id":-1},{"category":1,"price":1,"_id":1}]. Run npm run db:indexes.
```

After the release step, it starts, and logs in JSON:

```bash
$ npm run db:indexes
Indexes of products: [
  '_id_',
  'sku_1',
  'createdAt_-1__id_-1',
  'price_1__id_1',
  'category_1_createdAt_-1__id_-1',
  'category_1_price_1__id_1'
]
$ NODE_ENV=production npm run start:prod
...
{"level":"log","pid":2641,"timestamp":1795460206229,"message":"Nest application successfully started","context":"NestApplication"}
```

#### Production checklist

- **Set `NODE_ENV` to `production`**, and run `npm run build` and `npm run db:indexes` as a release step, before the new version starts. A new index on a large collection takes a while to build: add it in a release of its own before the release whose queries need it.
- **Run MongoDB as a replica set**, as any managed MongoDB service does. A single server is a single point of failure, and multi-document transactions, which this API doesn't need, require a replica set. The `mongodb+srv://` URI of a managed service passes the configuration's check.
- **Create the application's database user with the `readWrite` role on its database only**, and put its credentials in your platform's secret store, injected as `MONGODB_URI` at runtime, not in an image or a committed `.env` file.
- **Set `CORS_ORIGINS` to your web app's origins**, with their scheme and no path, or leave it empty if no browser calls the API.
- **Point the platform's probes at the health checks**: liveness at `/health/live`, readiness at `/health/ready`. If MongoDB is unreachable at startup, `@nestjs/mongoose` tries nine times, three seconds apart, each attempt waiting `serverSelectionTimeoutMS`, and the process exits with the error about 70 seconds after it started.
- **Collect the JSON logs from stdout** with your platform's log driver.
- **Keep every value that reaches a filter behind a schema**, in every new route, cursor and header: that's what keeps operator injection out.
- **Give production its own Observe key pair**, from the project's **API Keys** page, as `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the platform's environment: `start:prod` doesn't load `.env`. [NestJS Observe](/observability/overview) then records every request with its latency and failure rate per route, and a trace of each one, with the MongoDB queries it ran under the method that ran them, their values removed (see [Database queries and outbound HTTP](/observability/sdk#database-queries-and-outbound-http)). A list query that has lost its index shows up as a slow route before users complain.

#### What's next

- Let users sign up and sign in with JWT access and refresh tokens, and give each product an owner: [Build a REST API with JWT authentication](/tutorials/rest-api-jwt-authentication) adds sign-in to an API like this one, step by step.
- Decide who may edit the catalog: [Authorization](/security/authorization), as the [e-commerce tutorial](/tutorials/ecommerce-backend#let-staff-manage-the-catalog) does for staff.
- Limit how fast clients may call the API: [Rate limiting](/security/rate-limiting).
- Shape responses with a schema instead of `toJSON`: [Schema-based serialization](/application/serialization#schema-based-serialization).
- More of Mongoose in Nest, from subdocuments to multiple databases: [MongoDB](/data/mongodb).
