import { ChangeDetectionStrategy, Component } from '@angular/core';
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
    return 'This action returns all cats';
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
    return 'This action returns all cats';
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
    return 'This action returns all cats';
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
    return 'This action adds a new cat';
  }

  @Get()
  findAll() {
    return 'This action returns all cats';
  }
}`;
  }

  get routeParameters() {
    return `
@Get(':id')
findOne(@Param() params) {
  console.log(params.id);
  return \`This action returns a #\${params.id}\ cat\`;
}`;
  }

  get routeParameter() {
    return `
@Get(':id')
findOne(@Param('id') id) {
  return \`This action returns a #\${id}\ cat\`;
}`;
  }

  get statusCode() {
    return `
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}`;
  }

  get header() {
    return `
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'This action adds a new cat';
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
  return of([]);
}`;
  }

  get observableExampleJs() {
    return `
@Get()
findAll() {
  return of([]);
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
  return 'This action adds a new cat';
}`;
  }

  get exampleWithBodyJs() {
    return `
@Post()
@Bind(Body())
async create(createCatDto) {
  return 'This action adds a new cat';
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
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res) {
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
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  @Bind(Res())
  findAll(res) {
     res.status(HttpStatus.OK).json([]);
  }
}`;
  }

  get fullSample() {
    return `
import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto) {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(@Query() query) {
    return \`This action returns all cats (limit: \${query.limit} items)\`;
  }

  @Get(':id')
  findOne(@Param('id') id) {
    return \`This action returns a #\${id}\ cat\`;
  }

  @Put(':id')
  update(@Param('id') id, @Body() updateCatDto) {
    return \`This action updates a #\${id}\ cat\`;
  }

  @Delete(':id')
  remove(@Param('id') id) {
    return \`This action removes a #\${id}\ cat\`;
  }
}`;
  }
}
