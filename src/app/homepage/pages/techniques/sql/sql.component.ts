import { ChangeDetectionStrategy, Component } from '@angular/core';
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
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
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
  providers: [PhotoService],
  controllers: [PhotoController],
})
export class PhotoModule {}`;
  }

  get photoService() {
    return `
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
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
import { Injectable, Dependencies } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Photo } from './photo.entity';

@Injectable()
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
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'photo_db_host',
      entities: [Photo],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'personsConnection',
      host:  'person_db_host',
      entities: [Person],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host:  'album_db_host',
      entities: [Album],
    })
  ]
})
export class ApplicationModule {}`;
  }

  get forFeatureWithConnection() {
    return `
@Module({
  TypeOrmModule.forFeature([Photo]),
  TypeOrmModule.forFeature([Person], 'personsConnection'),
  TypeOrmModule.forFeature([Album], 'albumsConnection')
})
export class ApplicationModule {}`;
  }

  get injectConnectionAndEntityManager() {
    return `
@Injectable()
export class PersonService {
  constructor(
    @InjectConnection('personsConnection')
    private readonly connection: Connection,
    @InjectEntityManager('personsConnection')
    private readonly entityManager: EntityManager
  ) {}
}`;
  }

  get mockRepository() {
    return `
@Module({
  providers: [
    PhotoService,
    {
      provide: getRepositoryToken(Photo),
      useValue: mockRepository,
    },
  ],
})
export class PhotoModule {}`;
  }

  get customRepository() {
    return `
@EntityRepository(Author)
export class AuthorRepository extends Repository<Author> {}`;
  }

  get registerCustomRepository() {
    return `
@Module({
  imports: [TypeOrmModule.forFeature([Author, AuthorRepository])],
  controller: [AuthorController],
  providers: [AuthorService],
})
export class AuthorModule {}`;
  }

  get injectCustomRepository() {
    return `
@Injectable()
export class AuthorService {
  constructor(
    @InjectRepository(AuthorRepository)
    private readonly authorRepository: AuthorRepository,
  ) {}
}`;
  }
}
