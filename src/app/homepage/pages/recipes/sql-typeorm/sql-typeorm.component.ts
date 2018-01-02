import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-typeorm',
  templateUrl: './sql-typeorm.component.html',
  styleUrls: ['./sql-typeorm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlTypeormComponent extends BasePageComponent {
  get dependencies() {
    return `
$ npm install --save typeorm mysql`;
  }
  
  get databaseProviders() {
    return `
import { createConnection } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DbConnectionToken',
    useFactory: async () => await createConnection({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [
          __dirname + '/../**/*.entity{.ts,.js}',
      ],
      autoSchemaSync: true,
    }),
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

  get photoEntity() {
    return `
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}`;
  }

  get photoProviders() {
    return `
import { Connection, Repository } from 'typeorm';
import { Photo } from './photo.entity';

export const photoProviders = [
  {
    provide: 'PhotoRepositoryToken',
    useFactory: (connection: Connection) => connection.getRepository(Photo),
    inject: ['DbConnectionToken'],
  },
];`;
  }

  get photoService() {
    return `
import { Component, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Component()
export class PhotoService {
  constructor(
    @Inject('PhotoRepositoryToken') private readonly photoRepository: Repository<Photo>) {}

  async findAll(): Promise<Photo[]> {
    return await this.photoRepository.find();
  }
}`;
  }

  get photoModule() {
    return `
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { photoProviders } from './photo.providers';
import { PhotoService } from './photo.service';

@Module({
  imports: [DatabaseModule],
  components: [
    ...photoProviders,
    PhotoService,
  ],
})
export class PhotoModule {}`
  }
}