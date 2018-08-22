import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-swagger',
  templateUrl: './swagger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwaggerComponent extends BasePageComponent {
  get bootstrapFile() {
    return `
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);

  const options = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();`;
  }

  get postHandler() {
    return `
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get postHandlerJs() {
    return `
@Post()
@Bind(Body())
@ApiImplicitBody({ name: 'CreateCatDto', type: CreateCatDto })
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
`;
  }

  get createCatDto() {
    return `
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiModelProperty()
  readonly name: string;

  @ApiModelProperty()
  readonly age: number;

  @ApiModelProperty()
  readonly breed: string;
}`;
  }

  get createCatDtoJs() {
    return `
import { ApiModelProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiModelProperty({ type: String })
  readonly name;

  @ApiModelProperty({ type: Number })
  readonly age;

  @ApiModelProperty({ type: String })
  readonly breed;
}`;
  }

  get apiModelProperty() {
    return `
export declare const ApiModelProperty: (metadata?: {
  description?: string;
  required?: boolean;
  type?: any;
  isArray?: boolean;
  collectionFormat?: string;
  default?: any;
  enum?: SwaggerEnumType;
  format?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  readOnly?: boolean;
  xml?: any;
  example?: any;
}) => PropertyDecorator;`;
  }

  get apiModelPropertyOptional() {
    return `
@ApiModelProperty({ required: false })`;
  }

  get arrayProperty() {
    return `
@ApiModelProperty({ type: String, isArray: true })
readonly names: string[];`;
  }

  get useTags() {
    return `
@ApiUseTags('cats')
@Controller('cats')
export class CatsController {}`;
  }

  get response() {
    return `
@Post()
@ApiResponse({ status: 201, description: 'The record has been successfully created.'})
@ApiResponse({ status: 403, description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get customResponse() {
    return `
@Post()
@ApiCreatedResponse({ description: 'The record has been successfully created.'})
@ApiForbiddenResponse({ description: 'Forbidden.'})
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get bearerAuth() {
    return `
@ApiUseTags('cats')
@ApiBearerAuth()
@Controller('cats')
export class CatsController {}`;
  }

  get apiImplicitQuery() {
      return `
export const ApiImplicitQuery = (metadata: {
  name: string;
  description?: string;
  required?: boolean;
  type?: 'String' | 'Number' | 'Boolean' | any;
  isArray?: boolean;
  enum?: SwaggerEnumType;
  collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
}): MethodDecorator`;
  }

  get enumImplicitQuery() {
      return `
@ApiImplicitQuery({ name: 'role', enum: ['Admin', 'Moderator', 'User'] })
async filterByRole(@Query('role') role: UserRole = UserRole.User) {
  // role returns: UserRole.Admin, UserRole.Moderator OR UserRole.User
}`;
  }

  get enumProperty() {
      return `
@ApiModelProperty({ enum: ['Admin', 'Moderator', 'User']})
role: UserRole;`;
  }

  get userRoleEnum() {
      return `
export enum UserRole {
  Admin = 'Admin',
  Moderator = 'Moderator',
  User = 'User'
}`;
  }
}
