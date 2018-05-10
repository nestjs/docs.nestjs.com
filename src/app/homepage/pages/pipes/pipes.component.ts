import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-pipes',
  templateUrl: './pipes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PipesComponent extends BasePageComponent {
  get validationPipe() {
    return `
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}`;
  }

  get validationPipeJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationPipe {
  transform(value, metadata) {
    return value;
  }
}`;
  }

  get joiPipe() {
    return `
import * as Joi from 'joi';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const { error } = Joi.validate(value, this.schema);
    if (error) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}`;
  }

  get joiPipeJs() {
    return `
import * as Joi from 'joi';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe {
  constructor(schema) {
    this.schema = schema;
  }

  transform(value, metadata) {
    const { error } = Joi.validate(value, this.schema);
    if (error) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }
}`;
  }

  get useJoiPipe() {
    return `
@Post()
@UsePipes(new JoiValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get useJoiPipeJs() {
    return `
@Post()
@Bind(Body())
@UsePipes(new JoiValidationPipe(createCatSchema))
async create(createCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get argumentMetadata() {
    return `
export interface ArgumentMetadata {
  readonly type: 'body' | 'query' | 'param' | 'custom';
  readonly metatype?: new (...args) => any;
  readonly data?: string;
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
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
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
async create(@Body(new ValidationPipe()) createCatDto: CreateCatDto) {
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

  get globalScopedPipeModule() {
    return `
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: CustomGlobalPipe,
    },
  ],
})
export class ApplicationModule {}`;
  }

  get createCatsControllerMethodPipeClass() {
    return `
@Post()
@UsePipes(ValidationPipe)
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get globalPipe() {
    return `
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();`;
  }

  get parseIntPipe() {
    return `
import { PipeTransform, Injectable, ArgumentMetadata, HttpStatus, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}`;
  }

  get parseIntPipeJs() {
    return `
import { Injectable, BadRequestException} from '@nestjs/common';

@Injectable()
export class ParseIntPipe {
  transform(value, metadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
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

  get userBindParam() {
    return `
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}`;
  }

  get userBindParamJs() {
    return `
@Get(':id')
@Bind(Param('id', UserByIdPipe))
findOne(userEntity) {
  return userEntity;
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

  get createCatsControllerParamPipeTransformFalse() {
    return `
@Post()
@UsePipes(new ValidationPipe({ transform: false }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get constructorCode() {
    return `
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
}`;
  }

  get getValidationPipe() {
    return `
const app = await NestFactory.create(ApplicationModule);
const validationPipe = app
  .select(SharedModule)
  .get(ValidationPipe);

app.useGlobalPipes(validationPipe);
`;
  }
}
