import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mockgoose',
  templateUrl: './mockgoose.component.html',
  styleUrls: ['./mockgoose.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MockgooseComponent extends BasePageComponent {
  get dependencies() {
    return `
$ npm install --save mongoose
$ npm install --save-dev mockgoose
$ npm install --save-dev @types/mongoose`;
  }

  get dependenciesJs() {
    return `
$ npm install --save mongoose
$ npm install --save mockgoose`;
  }

  get databaseProviders() {
    return `
import * as mongoose from 'mongoose';
import { Mockgoose } from 'mockgoose';

export const databaseProviders = [
  {
    provide: 'DbToken',
    useFactory: async () => {
      (mongoose as any).Promise = global.Promise;
      
      if (process.env.NODE_ENV === 'test') {

        const mockgoose = new Mockgoose(mongoose);
        mockgoose.helper.setDbVersion('3.4.3');

        mockgoose.prepareStorage()
          .then(async () => {
            await mongoose.connect('mongodb://example.com/TestingDB', {
              useMongoClient: true,
            });
          });

      } else {

        await mongoose.connect('mongodb://localhost/nest', {
          useMongoClient: true,
        });
      }
      
      return mongoose;
    },
  },
];`;
  }

  get databaseModule() {
    return `
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  components: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}`;
  }

  get catSchema() {
    return `
import * as mongoose from 'mongoose';

export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});`;
  }

  get catsProviders() {
    return `
import { Connection } from 'mongoose';
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CatModelToken',
    useFactory: (mongoose) => mongoose.connection.model('Cat', CatSchema),
    inject: ['DbToken'],
  },
];`;
  }

  get catsProvidersJs() {
    return `
import { CatSchema } from './schemas/cat.schema';

export const catsProviders = [
  {
    provide: 'CatModelToken',
    useFactory: (mongoose) => mongoose.connection.model('Cat', CatSchema),
    inject: ['DbToken'],
  },
];`;
  }

  get catsService() {
    return `
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';

@Component()
export class CatsService {
  constructor(
    @Inject('CatModelToken') private readonly catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return await this.catModel.find().exec();
  }
}`;
  }

  get catsServiceJs() {
    return `
import { Component, Dependencies } from '@nestjs/common';

@Component()
@Dependencies('CatModelToken')
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return await createdCat.save();
  }

  async findAll() {
    return await this.catModel.find().exec();
  }
}`;
  }

  get catsModule() {
    return `
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { catsProviders } from './cats.providers';
import { DatabaseModule } from '../database/database.module';

@Module({
  modules: [DatabaseModule],
  controllers: [CatsController],
  components: [
    CatsService,
    ...catsProviders,
  ],
})
export class CatsModule {}`;
  }

  get catInterface() {
    return `
import { Document } from 'mongoose';

export interface Cat extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}`;
  }

  get e2eTests() {
    return `
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/modules/cats/cats.module';
import { CatsService } from '../../src/modules/cats/cats.service';

describe('Cats', () => {
    const server = express();
    server.use(bodyParser.json());

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            modules: [CatsModule],
          })
          .compile();

        const app = module.createNestApplication(server);
        await app.init();
    });
    
    it(\`/POST insert cat\`, () => {
        return request(server)
            .post('/cats')
            .send({
                name: 'Tiger',
                age: 2,
                breed: 'Russian Blue'
            })
            .expect(201);
    });

    it(\`/GET cats\`, async(done) => {
        const cats = await request(server)
            .get('/cats')
            .expect(200);
            
        const [ cat ] = cats.body;
        
        expect(cat.name).toBe('Tiger');
        expect(cat.age).toBe(2);
        expect(cat.breed).toBe('Russian Blue');
        
        done();
    });
});`;
  }
}
