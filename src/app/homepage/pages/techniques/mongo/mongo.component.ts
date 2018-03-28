import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mongo',
  templateUrl: './mongo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MongoComponent extends BasePageComponent {
  get importMongoose() {
    return `
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class ApplicationModule {}`;
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

  get catsModule() {
    return `
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Cat', schema: CatSchema }])],
  controllers: [CatsController],
  components: [CatsService],
})
export class CatsModule {}`
  }

  get catsService() {
    return `
import { Model } from 'mongoose';
import { Component } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './interfaces/cat.interface';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatSchema } from './schemas/cat.schema';

@Component()
export class CatsService {
  constructor(@InjectModel('Cat') private readonly catModel: Model<Cat>) {}

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
import { Model } from 'mongoose';
import { Component, Dependencies } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CatSchema } from './schemas/cat.schema';

@Component()
@Dependencies(InjectModel(CatSchema))
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
}
