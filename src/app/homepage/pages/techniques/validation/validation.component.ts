import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-validation',
  templateUrl: './validation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationComponent extends BasePageComponent {
  get autoValidation() {
    return `
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();`;
  }

  get createEndpoint() {
    return `
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}`;
  }

  get createCatDto() {
    return `
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}`;
  }

  get badRequest() {
    return `
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
      {
          "target": {},
          "property": "email",
          "children": [],
          "constraints": {
              "isEmail": "email must be an email"
          }
      }
  ]
}`;
  }

  get findOneEndpoint() {
    return `
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}`;
  }

  get findOneParams() {
    return `
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: number;
}`;
  }

  get disableErrors() {
    return `
app.useGlobalPipes(new ValidationPipe({
  disableErrorMessages: true,
}));`;
  }

  get strippingProperties() {
    return `
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
}));`;
  }

  get transforming() {
    return `
app.useGlobalPipes(new ValidationPipe({
  transform: true,
}));`;
  }
}
