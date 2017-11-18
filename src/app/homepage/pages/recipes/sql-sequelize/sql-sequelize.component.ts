import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-sequelize',
  templateUrl: './sql-sequelize.component.html',
  styleUrls: ['./sql-sequelize.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlSequelizeComponent extends BasePageComponent {
    get dependencies() {
      return `
  $ npm install --save sequelize sequelize-typescript mysql2
  $ npm install --save-dev @types/sequelize`;
    }

    get databaseProviders() {
      return `
import { Sequelize } from 'sequelize-typescript';
import { Cat } from '../cats/cat.entity';

export const databaseProviders = [
  {
    provide: 'SequelizeToken',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'nest',
      });
      sequelize.addModels([Cat]);
      await sequelize.sync();
      return sequelize;
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

    get catEntity() {
      return `
import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class Cat extends Model<Cat> {
  @Column
  name: string;

  @Column
  age: number;

  @Column
  breed: string;
}`;
    }

    get catsProviders() {
      return `
import { Cat } from './cat.entity';

export const catsProviders = [
  {
    provide: 'CatsRepository',
    useValue: Cat,
  },
];`;
    }

    get catsService() {
      return `
import { Component, Inject } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { Model } from 'sequelize-typescript';
import { Cat } from './cat.entity';

@Component()
export class CatsService {
  constructor(
    @Inject('CatsRepository') private readonly catsRepository: typeof Model) {}

  async findAll(): Promise<Cat[]> {
    return await this.catsRepository.findAll<Cat>();
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
  }
