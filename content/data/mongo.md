### Mongo

Nest supports two methods for integrating with the [MongoDB](https://www.mongodb.com/) database. You can either use the [TypeORM](https://github.com/typeorm/typeorm) module described in the [TypeORM chapter](/data/typeorm), which has a connector for MongoDB, or use [Mongoose](https://mongoosejs.com), the most popular MongoDB object modeling tool. This chapter describes the latter, using the dedicated `@nestjs/mongoose` package.

Start by installing the required dependencies:

```bash
$ npm i @nestjs/mongoose mongoose
```

Once the installation process is complete, import the `MongooseModule` into the root `AppModule`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as `mongoose.connect()` from the Mongoose package, as described in the [Mongoose connections guide](https://mongoosejs.com/docs/connections.html).

#### Model injection

With Mongoose, everything is derived from a [Schema](https://mongoosejs.com/docs/guide.html). Each schema maps to a MongoDB collection and defines the shape of the documents within that collection. Schemas are used to define [Models](https://mongoosejs.com/docs/models.html). Models are responsible for creating and reading documents from the underlying MongoDB database.

You can create schemas with NestJS decorators, or manually with Mongoose itself. Using decorators to create schemas greatly reduces boilerplate and improves overall code readability.

Let's define the `CatSchema`:

```typescript
@@filename(schemas/cat.schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

> info **Hint** You can also generate a raw schema definition using the `DefinitionsFactory` class (from the `@nestjs/mongoose` package). This allows you to manually modify the schema definition generated from the metadata you provided, which is useful for edge cases where it may be hard to represent everything with decorators.

The `@Schema()` decorator marks a class as a schema definition. It maps the `Cat` class to a MongoDB collection of the same name, but with an additional "s" at the end, so the final collection name is `cats`. This decorator accepts a single optional argument, a schema options object. Think of it as the object you would normally pass as the second argument of the `mongoose.Schema` class constructor (e.g., `new mongoose.Schema(_, options)`). To learn more about the available schema options, see the [Mongoose schema options](https://mongoosejs.com/docs/guide.html#options) documentation.

The `@Prop()` decorator defines a property in the document. For example, the schema definition above defines three properties: `name`, `age`, and `breed`. The [schema types](https://mongoosejs.com/docs/schematypes.html) for these properties are automatically inferred thanks to TypeScript metadata (and reflection) capabilities. However, in more complex scenarios in which types cannot be implicitly reflected (for example, arrays or nested object structures), you must indicate the types explicitly, as follows:

```typescript
@Prop([String])
tags: string[];
```

Alternatively, the `@Prop()` decorator accepts an options object argument (read more about the [available schema type options](https://mongoosejs.com/docs/schematypes.html#schematype-options)). With it, you can indicate whether a property is required, specify a default value, or mark it as immutable. For example:

```typescript
@Prop({ required: true })
name: string;
```

To specify a relation to another model (for populating later), use the `@Prop()` decorator as well. For example, if `Cat` has an `Owner` that is stored in a different collection called `owners`, the property should have `type` and `ref` options:

```typescript
import mongoose from 'mongoose';
import { Owner } from '../owners/schemas/owner.schema.js';

// inside the class definition
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
```

If there are multiple owners, your property configuration should look as follows:

```typescript
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[];
```

If you don't intend to always populate a reference to another collection, consider using `mongoose.Types.ObjectId` as the type instead:

```typescript
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
// This ensures the field is not confused with a populated reference
owner: mongoose.Types.ObjectId;
```

Then, when you need to selectively populate it later, use a repository function that specifies the correct type:

```typescript
import { Owner } from './schemas/owner.schema.js';

// e.g. inside a service or repository
async findAllPopulated() {
  return this.catModel.find().populate<{ owner: Owner }>("owner");
}
```

> info **Hint** If there is no foreign document to populate, the type could be `Owner | null`, depending on your [Mongoose configuration](https://mongoosejs.com/docs/populate.html#doc-not-found). Alternatively, it might throw an error, in which case the type is `Owner`.

Finally, you can also pass a **raw** schema definition to the decorator. This is useful when, for example, a property represents a nested object that is not defined as a class. For this, use the `raw()` function from the `@nestjs/mongoose` package, as follows:

```typescript
@Prop(raw({
  firstName: { type: String },
  lastName: { type: String }
}))
details: Record<string, any>;
```

Alternatively, if you prefer **not using decorators**, you can define a schema manually. For example:

```typescript
export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

The `cat.schema` file resides in a `schemas` folder in the `cats` directory, where the `CatsModule` is also defined. While you can store schema files wherever you prefer, we recommend storing them near their related **domain** objects, in the appropriate module directory.

Let's look at the `CatsModule`:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller.js';
import { CatsService } from './cats.service.js';
import { Cat, CatSchema } from './schemas/cat.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

The `MongooseModule` provides the `forFeature()` method to configure the module, including defining which models should be registered in the current scope. To use the models in another module as well, add `MongooseModule` to the `exports` array of `CatsModule` and import `CatsModule` in the other module.

Once you've registered the schema, you can inject a `Cat` model into the `CatsService` using the `@InjectModel()` decorator:

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema.js';
import { CreateCatDto } from './dto/create-cat.dto.js';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Model } from 'mongoose';
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema.js';

@Injectable()
@Dependencies(getModelToken(Cat.name))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
```

#### Connection

At times, you may need to access the native [Mongoose Connection](https://mongoosejs.com/docs/api.html#Connection) object, for example, to make native API calls on it. Inject the Mongoose connection with the `@InjectConnection()` decorator as follows:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private connection: Connection) {}
}
```

#### Sessions

To start a session with Mongoose, inject the database connection using `@InjectConnection()` rather than calling `mongoose.startSession()` directly. This integrates with the Nest dependency injection system and ensures the session is started on the connection that Nest manages.

Here's an example of how to start a session:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    // Your transaction logic here
  }
}
```

In this example, `@InjectConnection()` injects the Mongoose connection into the service. You can then call `connection.startSession()` to begin a new session and use it to manage database transactions, ensuring atomic operations across multiple queries. After starting the transaction, remember to commit or abort it based on your logic, and end the session when you're done.

#### Multiple databases

Some projects require multiple database connections, which this module also supports. To work with multiple connections, first create the connections. In this case, naming the connections is **mandatory**.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionName: 'cats',
    }),
    MongooseModule.forRoot('mongodb://localhost/users', {
      connectionName: 'users',
    }),
  ],
})
export class AppModule {}
```

> warning **Notice** Don't create multiple connections without a name or with the same name, otherwise they will override each other.

With this setup, you have to tell the `MongooseModule.forFeature()` method which connection to use:

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }], 'cats'),
  ],
})
export class CatsModule {}
```

You can also inject the `Connection` object for a given connection:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection('cats') private connection: Connection) {}
}
```

To inject a given `Connection` into a custom provider (for example, a factory provider), use the `getConnectionToken()` function, passing the name of the connection as an argument:

```typescript
{
  provide: CatsService,
  useFactory: (catsConnection: Connection) => {
    return new CatsService(catsConnection);
  },
  inject: [getConnectionToken('cats')],
}
```

To inject a model from a named connection, pass the connection name as the second argument to the `@InjectModel()` decorator:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name, 'cats') private catModel: Model<Cat>) {}
}
@@switch
@Injectable()
@Dependencies(getModelToken(Cat.name, 'cats'))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }
}
```

#### Hooks (middleware)

Middleware (also called pre and post hooks) are functions that are passed control during the execution of asynchronous functions. Middleware is specified at the schema level and is useful for writing plugins (see the [Mongoose middleware documentation](https://mongoosejs.com/docs/middleware.html)). Calling `pre()` or `post()` after compiling a model does not work in Mongoose. To register a hook **before** model registration, use the `forFeatureAsync()` method of the `MongooseModule` along with a factory provider (i.e., `useFactory`). With this technique, you can access a schema object, then use its `pre()` or `post()` method to register a hook on that schema. For example:

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatSchema;
          schema.pre('save', function () {
            console.log('Hello from pre save');
          });
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Like other [factory providers](/fundamentals/custom-providers#factory-providers-usefactory), the factory function can be `async` and can inject dependencies through `inject`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const schema = CatSchema;
          schema.pre('save', function() {
            console.log(
              `${configService.get('APP_NAME')}: Hello from pre save`,
            );
          });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
```

#### Plugins

To register a [plugin](https://mongoosejs.com/docs/plugins.html) for a given schema, use the `forFeatureAsync()` method:

```typescript
import autopopulate from 'mongoose-autopopulate';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatSchema;
          schema.plugin(autopopulate);
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

To register a plugin for all schemas at once, call the `.plugin()` method of the `Connection` object. You must access the connection before models are created; to do this, use the `connectionFactory` option:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import autopopulate from 'mongoose-autopopulate';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionFactory: (connection) => {
        connection.plugin(autopopulate);
        return connection;
      }
    }),
  ],
})
export class AppModule {}
```

#### Discriminators

[Discriminators](https://mongoosejs.com/docs/discriminators.html) are a schema inheritance mechanism. They enable you to have multiple models with overlapping schemas on top of the same underlying MongoDB collection.

Suppose you want to track different types of events in a single collection. Every event has a timestamp.

```typescript
@@filename(event.schema)
@Schema({ discriminatorKey: 'kind' })
export class Event {
  @Prop({
    type: String,
    required: true,
    enum: [ClickedLinkEvent.name, SignUpEvent.name],
  })
  kind: string;

  @Prop({ type: Date, required: true })
  time: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
```

> info **Hint** Mongoose tells discriminator models apart by the "discriminator key", which is `__t` by default. Mongoose adds a String path called `__t` to your schemas and uses it to track which discriminator a document is an instance of.
> You may also use the `discriminatorKey` option to define the path for discrimination.

`SignUpEvent` and `ClickedLinkEvent` instances will be stored in the same collection as generic events.

Now, let's define the `ClickedLinkEvent` class, as follows:

```typescript
@@filename(click-link-event.schema)
@Schema()
export class ClickedLinkEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  url: string;
}

export const ClickedLinkEventSchema = SchemaFactory.createForClass(ClickedLinkEvent);
```

And `SignUpEvent` class:

```typescript
@@filename(sign-up-event.schema)
@Schema()
export class SignUpEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  user: string;
}

export const SignUpEventSchema = SchemaFactory.createForClass(SignUpEvent);
```

With this in place, use the `discriminators` option to register discriminators for a given schema. It works with both `MongooseModule.forFeature()` and `MongooseModule.forFeatureAsync()`:

```typescript
@@filename(event.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickedLinkEvent.name, schema: ClickedLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ]
})
export class EventsModule {}
```

#### Testing

When unit testing an application, you usually want to avoid any database connection, which keeps test suites simpler to set up and faster to execute. However, your classes might depend on models that are pulled from the connection instance. To resolve these classes, create mock models.

To make this easier, the `@nestjs/mongoose` package exposes a `getModelToken()` function that returns a prepared [injection token](/fundamentals/custom-providers#di-fundamentals) based on a model name. Using this token, you can provide a mock implementation using any of the standard [custom provider](/fundamentals/custom-providers) techniques, including `useClass`, `useValue`, and `useFactory`. For example:

```typescript
@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken(Cat.name),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
```

In this example, a hardcoded `catModel` (object instance) is provided whenever any consumer injects a `Model<Cat>` using the `@InjectModel()` decorator.

<app-banner-courses></app-banner-courses>

#### Async configuration

When you need to pass module options asynchronously instead of statically, use the `forRootAsync()` method. As with most dynamic modules, Nest provides several techniques for async configuration.

One technique is to use a factory function:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
```

Like other [factory providers](/fundamentals/custom-providers#factory-providers-usefactory), the factory function can be `async` and can inject dependencies through `inject`.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
```

Alternatively, you can configure the `MongooseModule` using a class instead of a factory, as shown below:

```typescript
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
```

The construction above instantiates `MongooseConfigService` inside `MongooseModule`, using it to create the required options object. In this example, the `MongooseConfigService` has to implement the `MongooseOptionsFactory` interface, as shown below. The `MongooseModule` calls the `createMongooseOptions()` method on the instantiated object of the supplied class.

```typescript
@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
```

To reuse an existing options provider instead of creating a private copy inside the `MongooseModule`, use the `useExisting` syntax. The provider must implement the `MongooseOptionsFactory` interface:

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

#### Connection events

You can listen to Mongoose [connection events](https://mongoosejs.com/docs/connections.html#connection-events) using the `onConnectionCreate` configuration option. Nest calls this function with each connection as soon as the connection is created, before it opens, so you can register listeners for the `connected`, `open`, `disconnected`, `reconnected`, and `disconnecting` events, as demonstrated below:

```typescript
MongooseModule.forRoot('mongodb://localhost/test', {
  onConnectionCreate: (connection: Connection) => {
    connection.on('connected', () => console.log('connected'));
    connection.on('open', () => console.log('open'));
    connection.on('disconnected', () => console.log('disconnected'));
    connection.on('reconnected', () => console.log('reconnected'));
    connection.on('disconnecting', () => console.log('disconnecting'));

    return connection;
  },
}),
```

This code snippet establishes a connection to a MongoDB database at `mongodb://localhost/test`. The `onConnectionCreate` option sets up event listeners for monitoring the connection's status:

- `connected`: Triggered when the connection is successfully established.
- `open`: Fires when the connection is fully opened and ready for operations.
- `disconnected`: Called when the connection is lost.
- `reconnected`: Invoked when the connection is re-established after being disconnected.
- `disconnecting`: Occurs when the connection is in the process of closing.

You can also use the `onConnectionCreate` property in async configurations created with `MongooseModule.forRootAsync()`:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/test',
    onConnectionCreate: (connection: Connection) => {
      // Register event listeners here
      return connection;
    },
  }),
}),
```

#### Subdocuments

To nest subdocuments within a parent document, define your schemas as follows:

```typescript
@@filename(name.schema)
@Schema()
export class Name {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;
}

export const NameSchema = SchemaFactory.createForClass(Name);
```

And then reference the subdocument in the parent schema:

```typescript
@@filename(person.schema)
@Schema()
export class Person {
  @Prop(NameSchema)
  name: Name;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.Subdocument<Types.ObjectId> & Name;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

To include multiple subdocuments, use an array of subdocuments. Make sure to override the type of the property accordingly:

```typescript
@@filename(person.schema)
@Schema()
export class Person {
  @Prop([NameSchema])
  name: Name[];
}

export const PersonSchema = SchemaFactory.createForClass(Person);

export type PersonDocumentOverride = {
  name: Types.DocumentArray<Name>;
};

export type PersonDocument = HydratedDocument<Person, PersonDocumentOverride>;
```

#### Virtuals

In Mongoose, a **virtual** is a property that exists on a document but is not persisted to MongoDB. Instead, it is computed dynamically whenever it's accessed. Virtuals are typically used for derived or computed values, like combining fields (e.g., creating a `fullName` property by concatenating `firstName` and `lastName`), or for creating properties that rely on existing data in the document.

```ts
class Person {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Virtual({
    get: function (this: Person) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  fullName: string;
}
```

> info **Hint** The `@Virtual()` decorator is imported from the `@nestjs/mongoose` package.

In this example, the `fullName` virtual is derived from `firstName` and `lastName`. Even though it behaves like a normal property when accessed, it's never saved to the MongoDB document.

#### Example

A working example is available in the [nestjs/nest repository](https://github.com/nestjs/nest/tree/master/sample/06-mongoose).
