import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-custom-decorators',
  templateUrl: './custom-decorators.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDecoratorsComponent extends BasePageComponent {
  get userDecorator() {
    return `
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, req) => {
  return req.user;
});`;
  }

  get userDecoratorData() {
    return `
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, req) => {
  console.log(data); // test
  return req.user;
});`;
  }

  get controllerExampleData() {
    return `
@Get()
async findOne(@User('test') user: UserEntity) {
  console.log(user);
}`;
  }

  get controllerExampleDataJs() {
    return `
@Get()
@Bind(User('test'))
async findOne(user) {
  console.log(user);
}`;
  }

  get controllerExample() {
    return `
@Get()
async findOne(@User() user: UserEntity) {
  console.log(user);
}`;
  }

  get controllerExampleJs() {
    return `
@Get()
@Bind(User())
async findOne(user) {
  console.log(user);
}`;
  }

  get pipeExample() {
    return `
@Get()
async findOne(@User(new ValidationPipe()) user: UserEntity) {
  console.log(user);
}`;
  }

  get pipeExampleJs() {
    return `
@Get()
@Bind(User(new ValidationPipe()))
async findOne(user) {
  console.log(user);
}`;
  }
}
