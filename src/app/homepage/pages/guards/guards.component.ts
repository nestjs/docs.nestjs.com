import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-guards',
  templateUrl: './guards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuardsComponent extends BasePageComponent {
  get authGuard() {
    return `
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}`;
  }

  get authGuardJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard {
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    return await validateRequest(request);
  }
}`;
  }

  get rolesGuard() {
    return `
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}`;
  }

  get rolesGuardJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard {
  canActivate(context) {
    return true;
  }
}`;
  }

  get argumentsHost() {
    return `
export interface ArgumentsHost {
  getArgs<T extends Array<any> = any[]>(): T;
  getArgByIndex<T = any>(index: number): T;
  switchToRpc(): RpcArgumentsHost;
  switchToHttp(): HttpArgumentsHost;
  switchToWs(): WsArgumentsHost;
}`;
  }

  get executionContext() {
    return `
export interface ExecutionContext extends ArgumentsHost {
  getClass<T = any>(): Type<T>;
  getHandler(): Function;
}`;
  }

  get useGuards() {
    return `
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
`;
  }

  get useGuardsWithInstance() {
    return `
@Controller('cats')
@UseGuards(new RolesGuard())
export class CatsController {}
`;
  }

  get globalScopedGuardModule() {
    return `
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class ApplicationModule {}`;
  }

  get reflectMetadata() {
    return `
@Post()
@ReflectMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get reflectMetadataJs() {
    return `
@Post()
@ReflectMetadata('roles', ['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get rolesDecorator() {
    return `
import { ReflectMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => ReflectMetadata('roles', roles);`;
  }

  get rolesDecoratorJs() {
    return `
import { ReflectMetadata } from '@nestjs/common';

export const Roles = (...roles) => ReflectMetadata('roles', roles);`;
  }

  get catsRolesDecorator() {
    return `
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get catsRolesDecoratorJs() {
    return `
@Post()
@Roles('admin')
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}`;
  }

  get rolesGuardExt() {
    return `
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const hasRole = () => user.roles.some((role) => roles.includes(role));
    return user && user.roles && hasRole();
  }
}`;
  }

  get rolesGuardExtJs() {
    return `
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const roles = this.reflector.get('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const hasRole = () => user.roles.some((role) => roles.includes(role));
    return user && user.roles && hasRole();
  }
}`;
  }

  get controllerMetadata() {
    return `
const roles = this.reflector.get<string[]>('roles', context.getClass());`;
  }

  get controllerMetadataJs() {
    return `
const roles = this.reflector.get('roles', context.getClass());`;
  }

  get forbidden() {
    return `
{
  "statusCode": 403,
  "message": "Forbidden resource"
}`;
  }

  get globalGuard() {
    return `
const app = await NestFactory.create(ApplicationModule);
app.useGlobalGuards(new RolesGuard());`;
  }

  get getAuthGuard() {
    return `
const app = await NestFactory.create(ApplicationModule);
const authGuard = app
  .select(AuthModule)
  .get(AuthGuard);

app.useGlobalGuards(authGuard);
`;
  }
}
