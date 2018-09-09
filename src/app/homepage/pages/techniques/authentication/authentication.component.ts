import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthenticationComponent extends BasePageComponent {
  get dependencies() {
    return `
$ npm install --save @nestjs/passport passport passport-http-bearer`;
  }

  get authService() {
    return `
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(token: string): Promise<any> {
    // Validate if token passed along with HTTP request
    // is associated with any registered account in the database
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
    // Validate if token passed along with HTTP request
    // is associated with any registered account in the database
    return await this.usersService.findOneByToken(token);
  }
}`;
  }

  get httpStrategy() {
    return `
import { Strategy } from 'passport-http-bearer';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class HttpStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(token: string) {
    const user = await this.authService.validateUser(token);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}`;
  }

  get httpStrategyJs() {
    return `
import { Strategy } from 'passport-http-bearer';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class HttpStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(token) {
    const user = await this.authService.validateUser(token);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
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

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
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

  get useGuardsDefault() {
    return `
@Get('users')
@UseGuards(AuthGuard())
findAll() {
  return [];
}`;
  }

  get useGuardsJwt() {
    return `
@Get('users')
@UseGuards(AuthGuard())
findAll() {
  return [];
}`;
  }

  get passportModule() {
    return `
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpStrategy } from './http.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer' }),
    UsersModule,
  ],
  providers: [AuthService, HttpStrategy],
})
export class AuthModule {}`;
  }

  get passportModuleJs() {
    return `
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpStrategy } from './http.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'bearer' }),
    UsersModule,
  ],
  providers: [AuthService, HttpStrategy],
})
export class AuthModule {}`;
  }

  get userObject() {
    return `
PassportModule.register({ property: 'profile' })`;
  }

  get passportOptions() {
    return `
PassportModule.register({ session: true })`;
  }

  get authServiceJwt() {
    return `
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(): Promise<string> {
    // In the real-world app you shouldn't expose this method publicly
    // instead, return a token once you verify user credentials
    const user: JwtPayload = { email: 'user@email.com' };
    return this.jwtService.sign(user);
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    return await this.usersService.findOneByEmail(payload.email);
  }
}`;
  }

  get authServiceJwtJs() {
    return `
import { JwtService } from '@nestjs/jwt';
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
@Dependencies(UsersService, JwtService)
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn() {
    // In the real-world app you shouldn't expose this method publicly
    // instead, return a token once you verify user credentials
    const user = { email: 'user@email.com' };
    return this.jwtService.sign(user);
  }

  async validateUser(payload) {
    return await this.usersService.findOneByEmail(payload.email);
  }
}`;
  }

  get authModuleJwt() {
    return `
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: 'secretKey',
      signOptions: {
        expiresIn: 3600,
      },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}`;
  }

  get authModuleJwtJs() {
    return `
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secretOrPrivateKey: 'secretKey',
      signOptions: {
        expiresIn: 3600,
      },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}`;
  }

  get multipleStrategies() {
    return `
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt')`;
  }

  get inheritance() {
    return `
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}`;
  }
}
