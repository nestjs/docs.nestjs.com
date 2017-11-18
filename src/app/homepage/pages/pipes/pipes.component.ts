import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-pipes',
  templateUrl: './pipes.component.html',
  styleUrls: ['./pipes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipesComponent extends BasePageComponent {
  get validationPipe() {
    return `
import { PipeTransform, Pipe, ArgumentMetadata } from '@nestjs/common';

@Pipe()
export class ValidationPipe implements PipeTransform<any> {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}`;
  }

  get argumentMetadata() {
    return `
export interface ArgumentMetadata {
    type: 'body' | 'query' | 'param';
    metatype?: new (...args) => any;
    data?: string;
}`;
  }

  get createCatsController() {
    return `
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get createCatDto() {
    return `
export class CreateCatDto {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}`;
  }

  get createCatDtoValidation() {
    return `
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  readonly name: string;

  @IsInt()
  readonly age: number;

  @IsString()
  readonly breed: string;
}`;
  }

  get fullValidationPipe() {
    return `
import { HttpException } from '@nestjs/core';
import { PipeTransform, Pipe, ArgumentMetadata, HttpStatus } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Pipe()
export class ValidationPipe implements PipeTransform<any> {
    async transform(value, metadata: ArgumentMetadata) {
      const { metatype } = metadata;
      if (!metatype || !this.toValidate(metatype)) {
          return value;
      }
      const object = plainToClass(metatype, value);
      const errors = await validate(object);
      if (errors.length > 0) {
          throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST);
      }
      return value;
    }

    private toValidate(metatype): boolean {
      const types = [String, Boolean, Number, Array, Object];
      return !types.find((type) => metatype === type);
    }
}`;
  }

  get createCatsControllerParamPipe() {
    return `
@Post()
async create(@Body('', new ValidationPipe()) createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`;
  }

  get createCatsControllerMethodPipe() {
    return `
@Post()
@UsePipes(new ValidationPipe())
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get globalPipe() {
    return `
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);

  app.use(bodyParser.json());
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();`;
  }

  get parseIntPipe() {
    return `
import { HttpException } from '@nestjs/core';
import { PipeTransform, Pipe, ArgumentMetadata, HttpStatus } from '@nestjs/common';

@Pipe()
export class ParseIntPipe implements PipeTransform<string> {
  async transform(value: string, metadata: ArgumentMetadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST);
    }
    return val;
  }
}`;
  }

  get parseIntPipeJs() {
    return `
import { HttpException } from '@nestjs/core';
import { Pipe, HttpStatus } from '@nestjs/common';

@Pipe()
export class ParseIntPipe {
  async transform(value, metadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST);
    }
    return val;
  }
}`;
  }

  get bindParam() {
    return `
@Get(':id')
async findOne(@Param('id', new ParseIntPipe()) id) {
  return await this.catsService.findOne(id);
}`;
  }

  get bindParamJs() {
    return `
@Get(':id')
@Bind(Param('id', new ParseIntPipe()))
async findOne(id) {
  return await this.catsService.findOne(id);
}`;
  }

  get bindBodyParam() {
    return `
@Post()
async create(@Body(new CustomPipe()) createCatDto: CreateCatDto) {
  await this.catsService.create(createCatDto);
}`;
  }

  get bindBodyParamJs() {
    return `
@Post()
@Bind(Body(new CustomPipe()))
async create(createCatDto) {
  await this.catsService.create(createCatDto);
}`;
  }
}
