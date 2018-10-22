import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-components',
  templateUrl: './components.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsComponent extends BasePageComponent {
  get catsService() {
    return `
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
`;
  }

  get catsServiceJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  create(cat) {
    this.cats.push(cat);
  }

  findAll() {
    return this.cats;
  }
}
`;
  }

  get catsController() {
    return `
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}`;
  }

  get catsControllerJs() {
    return `
import { Controller, Get, Post, Body, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Post()
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}`;
  }

  get constructorSyntax() {
    return `
constructor(private readonly catsService: CatsService) {}`;
  }

  get appModule() {
    return `
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class ApplicationModule {}
`;
  }

  get optional() {
    return `
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(
    @Optional() @Inject('HTTP_OPTIONS') private readonly httpClient: T,
  ) {}
}`;
  }

  get propertyInjection() {
    return `
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}`;
  }
}
