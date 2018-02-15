import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlComponent extends BasePageComponent {
  get importTypeOrm() {
    return `
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
  ],
})
export class ApplicationModule {}`;
  }

  get ormconfig() {
    return `
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "root",
  "database": "test",
  "entities": ["src/**/**.entity{.ts,.js}"],
  "synchronize": true
}`;
  }

  get importTypeOrmEmpty() {
    return `
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot()],
})
export class ApplicationModule {}`;
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

  get importConnectionInstance() {
    return `
import { Connection } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), PhotoModule],
})
export class ApplicationModule {
  constructor(private readonly connection: Connection) {}
}`;
  }

  get importConnectionInstanceJs() {
    return `
import { Connection } from 'typeorm';

@Dependencies(Connection)
@Module({
  imports: [TypeOrmModule.forRoot(), PhotoModule],
})
export class ApplicationModule {
  constructor(connection) {
    this.connection = connection;
  }
}`;
  }

  get photoModule() {
    return `
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { Photo } from './photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  components: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}`;
  }

  get photoService() {
    return `
import { Component, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Component()
export class PhotoService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  async findAll(): Promise<Photo[]> {
    return await this.photoRepository.find();
  }
}`;
  }

  get photoServiceJs() {
    return `
import { Component, Dependencies } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Photo } from './photo.entity';

@Component()
@Dependencies(InjectRepository(Photo))
export class PhotoService {
  constructor(photoRepository) {
    this.photoRepository = photoRepository;
  }

  async findAll() {
    return await this.photoRepository.find();
  }
}`;
  }

  get multipleConnections() {
    return `
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host:  'photo_db_host',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'db',
      entities: [ Photo ],
      synchronize: true
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      name: 'personsConnection',
      host:  'person_db_host',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'db',
      entities: [ Person ],
      synchronize: true
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      name: 'albumsConnection',
      host:  'album_db_host',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'db',
      entities: [ Album ],
      synchronize: true
    })
  ]
})
export class ApplicationModule {}`;
  }

  get forFeatureWithConnection() {
    return `
@Module({
  // ...
  TypeOrmModule.forFeature([ 'Photo' ]),
  TypeOrmModule.forFeature([ 'Person' ], 'personsConnection'),
  TypeOrmModule.forFeature([ 'Album' ], 'albumsConnection')
})    
export class ApplicationModule {}`;
  }

  get injectConnectionAndEntityManager() {
    return `
@Component()
export class PersonService {
  constructor(
    @InjectConnection('personsConnection') private readonly connection: Connection,
    @InjectEntityManager('personsConnection') private readonly entityManager: EntityManager
  ) {}
}`;
  }

}
