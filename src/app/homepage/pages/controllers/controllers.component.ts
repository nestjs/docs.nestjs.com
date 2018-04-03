import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-controllers',
  templateUrl: './controllers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControllersComponent extends BasePageComponent {
  get catsController(): string {
    return `
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return [];
  }
}`;
  }

  get requestObject(): string {
    return `
import { Controller, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request) {
    return [];
  }
}`;
  }

  get requestObjectJs(): string {
    return `
import { Controller, Bind, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  @Bind(Req())
  findAll(request) {
    return [];
  }
}`;
  }

  get postEndpoint() {
    return `
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create() {
    // TODO: Add some logic here
  }

  @Get()
  findAll() {
    return [];
  }
}`;
  }

  get routeParameters() {
    return `
@Get(':id')
findOne(@Param() params) {
  console.log(params.id);
  return {};
}`;
  }

  get statusCode() {
    return `
import { Controller, Get, Post, HttpCode } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @HttpCode(204)
  @Post()
  create() {
    // TODO: Add some logic here
  }

  @Get()
  findAll() {
    return [];
  }
}`;
  }

  get asyncExample() {
    return `
@Get()
async findAll(): Promise<any[]> {
  return [];
}`;
  }

  get asyncExampleJs() {
    return `
@Get()
async findAll() {
  return [];
}`;
  }

  get observableExample() {
    return `
@Get()
findAll(): Observable<any[]> {
  return Observable.of([]);
}`;
  }

  get observableExampleJs() {
    return `
@Get()
findAll() {
  return Observable.of([]);
}`;
  }

  get createCatSchema() {
    return `
export class CreateCatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}`;
  }

  get exampleWithBody() {
    return `
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  // TODO: Add some logic here
}`;
  }

  get exampleWithBodyJs() {
    return `
@Post()
@Bind(Body())
async create(createCatDto) {
// TODO: Add some logic here
}`;
  }

  get appModule() {
    return `
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class ApplicationModule {}`;
  }

  get bodyParser() {
    return `
import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.use(bodyParser.json());
  await app.listen(3000);
}
bootstrap();`;
  }

  get expressWay() {
    return `
import { Controller, Get, Post, Res, Body, HttpStatus } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res, @Body() createCatDto: CreateCatDto) {
    // TODO: Add some logic here
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res) {
     res.status(HttpStatus.OK).json([]);
  }
}`;
  }

  get expressWayJs() {
    return `
import { Controller, Get, Post, Bind, Res, Body, HttpStatus } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Res(), Body())
  create(res, createCatDto) {
    // TODO: Add some logic here
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  @Bind(Res())
  findAll(res) {
     res.status(HttpStatus.OK).json([]);
  }
}`;
  }
}
