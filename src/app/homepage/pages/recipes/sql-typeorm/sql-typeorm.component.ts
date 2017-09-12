import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql-typeorm',
  templateUrl: './sql-typeorm.component.html',
  styleUrls: ['./sql-typeorm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlTypeormComponent extends BasePageComponent {
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
          __dirname + '../**/*.entity.ts',
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
}