import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-guards',
  templateUrl: './guards.component.html',
  styleUrls: ['./guards.component.scss'],
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

  get rolesDecorator() {
    return `
import { ReflectMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => ReflectMetadata('roles', roles);`;
  }

  get catsRolesDecorator() {
    return `
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
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
    const hasRole = () => !!user.roles.find((role) => !!roles.find((item) => item === role));
    return user && user.roles && hasRole();
  }
}`;
  }

  get controllerMetadata() {
    return `
const roles = this.reflector.get<string[]>('roles', parent);`;
  }

  get forbidden() {
    return `
{
  "statusCode": 403,
  "message": "Forbidden resource"
}`;
  }
}