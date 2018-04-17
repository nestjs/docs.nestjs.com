import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-guards',
  templateUrl: './guards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuardsComponent extends BasePageComponent {
  get rolesGuard() {
    return `
import { Guard, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';

@Guard()
export class RolesGuard implements CanActivate {
  canActivate(dataOrRequest, context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}`;
  }

  get rolesGuardJs() {
    return `
import { Guard } from '@nestjs/common';

@Guard()
export class RolesGuard {
  canActivate(dataOrRequest, context) {
    return true;
  }
}`;
  }

  get useGuards() {
    return `
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
`;
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
import { Guard, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import { Reflector } from '@nestjs/core';

@Guard()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(req, context: ExecutionContext): boolean {
    const { parent, handler } = context;
    const roles = this.reflector.get<string[]>('roles', handler);
    if (!roles) {
      return true;
    }

    const user = req.user;
    const hasRole = () => user.roles.some((role) => roles.includes(role));
    return user && user.roles && hasRole();
  }
}`;
  }

  get rolesGuardExtJs() {
    return `
import { Guard, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Guard()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(req, context) {
    const { parent, handler } = context;
    const roles = this.reflector.get('roles', handler);
    if (!roles) {
      return true;
    }

    const user = req.user;
    const hasRole = () => !!user.roles.find((role) => !!roles.find((item) => item === role));
    return user && user.roles && hasRole();
  }
}`;
  }

  get controllerMetadata() {
    return `
const roles = this.reflector.get<string[]>('roles', parent);`;
  }

  get controllerMetadataJs() {
    return `
const roles = this.reflector.get('roles', parent);`;
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
