import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationComponent extends BasePageComponent {
  get dependencies() {
    return `
$ npm install --save @nestjs/passport passport passport-jwt passport-http-bearer jsonwebtoken`;
  }

  get authService() {
    return `
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(token: string): Promise<any> {
    return await this.usersService.findOneByToken(token);
  }
}`;
  }

  get authServiceJs() {
    return `
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(token) {
    return await this.usersService.findOneByToken(token);
  }
}`;
  }

  get httpStrategy() {
    return `
import { BearerStrategy } from 'passport-http-bearer';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class HttpStrategy extends PassportStrategy(BearerStrategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(token: any, done: Function) {
    const user = await this.authService.validateUser(token);
    if (!user) {
      return done(new UnauthorizedException(), false);
    }
    done(null, user);
  }
}`;
  }

  get httpStrategyJs() {
    return `
import { BearerStrategy } from 'passport-http-bearer';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class HttpStrategy extends PassportStrategy(BearerStrategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(token, done) {
    const user = await this.authService.validateUser(token);
    if (!user) {
      return done(new UnauthorizedException(), false);
    }
    done(null, user);
  }
}`;
  }
  
  get jwtStrategy() {
    return `
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secretKey',
    });
  }

  async validate(payload: JwtPayload, done: Function) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      return done(new UnauthorizedException(), false);
    }
    done(null, user);
  }
}`;
  }

  get jwtStrategyJs() {
    return `
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';

@Injectable()
@Dependencies(AuthService)
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secretKey',
    });
    this.authService = authService;
  }

  async validate(payload, done) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      return done(new UnauthorizedException(), false);
    }
    done(null, user);
  }
}`;
  }

  get authModule() {
    return `
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpStrategy } from './http.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService, HttpStrategy],
})
export class AuthModule {}`;
  }

  get authModuleJs() {
    return `
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpStrategy } from './http.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService, HttpStrategy],
})
export class AuthModule {}`;
  }

  get useGuards() {
    return `
@Get('users')
@UseGuards(AuthGuard('bearer'))
findAll() {
  return [];
}`;
  }

  get useGuardsJwt() {
    return `
@Get('users')
@UseGuards(AuthGuard('jwt'))
findAll() {
  return [];
}`;
  }

  get authServiceJwt() {
    return `
import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async createToken() {
    const user: JwtPayload = { email: 'user@email.com' };
    return jwt.sign(user, 'secretKey', { expiresIn: 3600 });
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    return await this.usersService.findOneByEmail(payload.email);
  }
}`;
  }

  get authServiceJwtJs() {
    return `
import * as jwt from 'jsonwebtoken';
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async createToken() {
    const user = { email: 'user@email.com' };
    return jwt.sign(user, 'secretKey', { expiresIn: 3600 });
  }

  async validateUser(payload) {
    return await this.usersService.findOneByEmail(payload.email);
  }
}`;
  }

  get authModuleJwt() {
    return `
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}`;
  }

  get authModuleJwtJs() {
    return `
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}`;
  }
}
