### Typegoose (Mongoose)

[Typegoose](https://github.com/typegoose/typegoose) is a well maintained TypeScript wrapper for the [Mongoose ODM](https://mongoosejs.com/) library and is similar in nature to [the Mongoose Module](/techniques/mongodb) Nest provides. However, Typegoose's TypeScript support is more expansive, making your entity/model classes and your work with Mongoose, and in turn MongoDB, more expressive. Typegoose also offers extras like a specialized logger, a few extra types for a much better and more concise usage of Typegoose (and Mongoose), some added type guard methods, a number of specialized functions and more.  

This recipe will get you started working with Typegoose in NestJS.

#### Getting started

To begin, you'll need to install the following dependencies into your [already created NestJS app](/first-steps):

```typescript
$ npm install --save mongoose @typegoose/typegoose @m8a/nestjs-typegoose
```

Here is a short description of each package. 

 - **mongoose** - the core and powerful Mongoose ODM library
 - **@typegoose/typegoose** - the Typegoose library
 - **@m8a/nestjs-typegoose** - the package containing the Typegoose module for plugging in Typegoose into Nest

> info **Hint** Some of the content in this recipe was taken from the [documentation of the Typegoose module](https://nestjs-typegoose.m8a.io/). You can get further details there and also further details about Typegoose at their [docs website](https://typegoose.github.io/typegoose/docs/guides/quick-start-guide). 

#### Setting up the DB Connection
For the next step, we will need to configure the connection to the MongoDB database. To do that, we'll use the `TypegooseModule.forRoot` static method. 

```typescript
@@filename(app.module)
import { Module } from "@nestjs/common";
import { TypegooseModule } from "@m8a/nestjs-typegoose";

@Module({
  imports: [
    TypegooseModule.forRoot("mongodb://localhost:27017/otherdb", {
      // other connection options
    }),
    CatsModule
  ]
})
export class ApplicationModule {}
@@switch
import { Module } from "@nestjs/common";
import { TypegooseModule } from "@m8a/nestjs-typegoose";

@Module({
  imports: [
    TypegooseModule.forRoot("mongodb://localhost:27017/otherdb", {
      // other connection options
    }),
    CatsModule
  ]
})
export class ApplicationModule {}
```
The second parameter of the `TypegooseModule.forRoot` static method entails [the additional connection options](https://mongoosejs.com/docs/connections.html#options) available from Mongoose.

Also notice we imported the `CatsModule`. We will create that module shortly.

If you have requirements to use multiple databases, you can also implement [multiple connections to different databases](https://nestjs-typegoose.m8a.io/docs/multiple-connections).

#### Creating Entities

Now that you have the dependencies installed and the database connection is set up, let's create our first entity. This is a very simplified example.

```typescript
@@filename(cat.entity)
import { Prop } from "@typegoose/typegoose";

export class Cat {
  @Prop({ required: true })
  public name!: string;
}
@@switch
import { Prop } from "@typegoose/typegoose";

export class Cat {
  @Prop({ required: true })
  public name!: string;
}
```

Entity classes, like above, are basically schema definitions, which Typegoose converts to models in Mongoose.   

> info **Hint** You can also call your entity file "model" i.e. `cat.model.ts`. This file naming convention is up to you.

#### Creating a Service (with a Model)

In order to inject a Mongoose model into any Nest provider, you need to use the `@InjectModel` decorator inside your provider class' constructor as shown in the following example of a service.

```typescript
@@filename(cat.service)
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@m8a/nestjs-typegoose";
import { Cat } from "./cat.model";
import { ReturnModelType } from "@typegoose/typegoose";

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat) private readonly catModel: ReturnModelType<typeof Cat>
  ) {}

  async create(createCatDto: { name: string }): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll(): Promise<Cat[] | null> {
    return await this.catModel.find().exec();
  }
}
@@switch
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@m8a/nestjs-typegoose";
import { Cat } from "./cat.model";
import { ReturnModelType } from "@typegoose/typegoose";

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat) private readonly catModel: ReturnModelType<typeof Cat>
  ) {}

  async create(createCatDto: { name: string }): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll(): Promise<Cat[] | null> {
    return await this.catModel.find().exec();
  }
}
```
From the example above, you can see a more specific type used by Typegoose to define the model called (`ReturnModelType`). This type is more expressive than the `HydratedDocument` type provided by Mongoose.

#### Providing the Model

We have to make sure we provide the needed models to our service with `TypegooseModule.forFeature` for the `@InjectModel` to work. This helps prevents unauthorized access to other models.

```typescript
@@filename(cat.module)
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@m8a/nestjs-typegoose";
import { Cat } from "./cat.model";
import { ReturnModelType } from "@typegoose/typegoose";

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat) private readonly catModel: ReturnModelType<typeof Cat>
  ) {}

  async create(createCatDto: { name: string }): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll(): Promise<Cat[] | null> {
    return await this.catModel.find().exec();
  }
}

@@switch
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@m8a/nestjs-typegoose";
import { Cat } from "./cat.model";
import { ReturnModelType } from "@typegoose/typegoose";

@Injectable()
export class CatsService {
  constructor(
    @InjectModel(Cat) private readonly catModel: ReturnModelType<typeof Cat>
  ) {}

  async create(createCatDto: { name: string }): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll(): Promise<Cat[] | null> {
    return await this.catModel.find().exec();
  }
}
```
#### Async Configuration

To provide asynchronous mongoose schema options (similar to NestJS' Mongoose module implementation) you can use the `TypegooseModule.forRootAsync`

```typescript
@@filename(cat.module)
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.getString("MONGODB_URI")
        // ...typegooseOptions (Note: config is spread with the uri)
      }),
      inject: [ConfigService]
    })
  ]
})
export class CatsModule {}
@@switch
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.getString("MONGODB_URI")
        // ...typegooseOptions (Note: config is spread with the uri)
      }),
      inject: [ConfigService]
    })
  ]
})
export class CatsModule {}
```
The `typegooseOptions` is spread with the `uri`. The `uri` is required!

You can also use a class with `useClass`.
```typescript
@@filename(cat.module)
import {
  TypegooseOptionsFactory,
  TypegooseModuleOptions
} from "nestjs-typegoose";

class TypegooseConfigService extends TypegooseOptionsFactory {
  createTypegooseOptions():
    | Promise<TypegooseModuleOptions>
    | TypegooseModuleOptions {
    return {
      uri: "mongodb://localhost/nest"
    };
  }
}

@Module({
  imports: [
    TypegooseModule.forRootAsync({
      useClass: TypegooseConfigService
    })
  ]
})
export class CatsModule {}
@@switch
import {
  TypegooseOptionsFactory,
  TypegooseModuleOptions
} from "nestjs-typegoose";

class TypegooseConfigService extends TypegooseOptionsFactory {
  createTypegooseOptions():
    | Promise<TypegooseModuleOptions>
    | TypegooseModuleOptions {
    return {
      uri: "mongodb://localhost/nest"
    };
  }
}

@Module({
  imports: [
    TypegooseModule.forRootAsync({
      useClass: TypegooseConfigService
    })
  ]
})
export class CatsModule {}
```
Or, if you want to prevent creating another `TypegooseConfigService` class and want to use it from another imported module then use `useExisting`.
```typescript
@@filename(cat.module)
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: ConfigService
    })
  ]
})
export class CatsModule {}
@@switch
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: ConfigService
    })
  ]
})
export class CatsModule {}
```

#### Testing
Like Nest's Mongoose module (see the [testing section](http://localhost:4200/techniques/mongodb#testing)), nestjs-typegoose's `forFeature` and `forRoot` rely on a database connection to work. To unit test your `CatService` without connecting to a MongoDB database, you'll need to create a fake model using a [custom provider](/fundamentals/custom-providers).
```typescript
@@filename(cat.module)
import { getModelToken } from "@m8a/nestjs-typegoose";

@Module({
  CatService,
  {
    provide: getModelToken('Cat'),
    useValue: fakeCatModel
  }
})
@@switch
import { getModelToken } from "@m8a/nestjs-typegoose";

@Module({
  CatService,
  {
    provide: getModelToken('Cat'),
    useValue: fakeCatModel
  }
})
```
In a spec file this would look like:
```typescript
@@filename(cat.service.spec)
const fakeCatModel = jest.fn();

const module: TestingModule = await Test.createTestingModule({
  providers: [
    {
      provide: getModelToken(Cat.name),
      useValue: fakeCatModel
    },
    CatService
  ]
}).compile();
@@switch
const fakeCatModel = jest.fn();

const module: TestingModule = await Test.createTestingModule({
  providers: [
    {
      provide: getModelToken(Cat.name),
      useValue: fakeCatModel
    },
    CatService
  ]
}).compile();
```
Overall, between the docs of the Typegoose module and Typegoose, you can attain a strong basis to  work with Mongoose in a much more powerful/ typed manner with NestJS. Should you have any further questions, you can ask them on the [NestJS Discord channel](https://discord.gg/nestjs). Go to the .
