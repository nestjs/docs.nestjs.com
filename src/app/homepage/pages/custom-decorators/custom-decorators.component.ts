import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-custom-decorators',
  templateUrl: './custom-decorators.component.html',
  styleUrls: ['./custom-decorators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomDecoratorsComponent {
  get userDecorator() {
    return `
import { createRouteParamDecorator } from '@nestjs/common';

export const User = createRouteParamDecorator((data, req) => {
  return req.user;
});`;
  }

  get userDecoratorData() {
    return `
import { createRouteParamDecorator } from '@nestjs/common';

export const User = createRouteParamDecorator((data, req) => {
  console.log(data); // test
  return req.user;
});`;
  }

  get controllerExampleData() {
    return `
@Get()
async findOne(@User('test') user: User) {
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
async findOne(@User() user: User) {
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
async findOne(@User(new ValidationPipe()) user: User) {
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
