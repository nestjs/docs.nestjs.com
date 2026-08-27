import{a as I}from"./chunk-HP65REBS.js";import{a as A,b as k}from"./chunk-AO7BAPTM.js";import{G as i,L as x,Ma as j,N as f,Qa as S,Ra as g,Sa as E,V as n,W as t,X as r,ja as d,ka as l,la as e,na as c,oa as D,ua as m,va as p,y as h}from"./chunk-IPH2CUBH.js";var M=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-authentication"]],features:[f],decls:529,vars:68,consts:[["contentReference",""],["app6a7b48a34c14df121cc64f20d6ddb97d8f8073fb",""],["app84f751c30276db7c31ac8218e4a8d07dd05da8d7",""],["app1b93a99eab3f0afd31291324d92beb9c77dcc3a1",""],["app357976f1cfcde266b9d70b1d3cb4e669406ed7bf",""],["app97619ef0cfe4971a43611defbf1583db976bba55",""],["app5900031adf88d55f00c1f1085597fc6060a7d122",""],["app89185d9084846b4f510ab8e6dd26f8208fca9dd7",""],["app61f73545bd0b14b967b8ee2f807e4d7c7180bf0d",""],["appbf4604559dcd5499e247cc4ca35033497560668c",""],["app4d25f6e962963bffad4d0833428e02bb0100017b",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/authentication.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","authentication"],["rel","nofollow","target","_blank","href","https://tools.ietf.org/html/rfc6750"],["appAnchor","","id","creating-an-authentication-module"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["appAnchor","","id","implementing-the-sign-in-endpoint"],[1,"Warning"],["rel","nofollow","target","_blank","href","https://github.com/kelektiv/node.bcrypt.js#readme"],[1,"info"],["routerLink","/techniques/validation"],["appAnchor","","id","jwt-token"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/jwt"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/jwt/blob/master/README.md"],["rel","nofollow","target","_blank","href","https://github.com/auth0/node-jsonwebtoken#usage"],["appAnchor","","id","implementing-the-authentication-guard"],["appAnchor","","id","enable-authentication-globally"],["href","/guards#binding-guards"],["href","/guards#putting-it-all-together"],["appAnchor","","id","passport-integration"],["rel","nofollow","target","_blank","href","https://github.com/jaredhanson/passport"],["routerLink","/recipes/passport"],["appAnchor","","id","example"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt"]],template:function(s,u){if(s&1&&(n(0,"div",11,0)(2,"div",12)(3,"a",13),r(4,"i",14),t()(),n(5,"h3",15),e(6,"Authentication"),t(),n(7,"p"),e(8,"Authentication is an "),n(9,"strong"),e(10,"essential"),t(),e(11," part of most applications. There are many different approaches and strategies to handle authentication. The approach taken for any project depends on its particular application requirements. This chapter presents several approaches to authentication that can be adapted to a variety of different requirements."),t(),n(12,"p"),e(13,"Let's flesh out our requirements. For this use case, clients will start by authenticating with a username and password. Once authenticated, the server will issue a JWT that can be sent as a "),n(14,"a",16),e(15,"bearer token"),t(),e(16," in an authorization header on subsequent requests to prove authentication. We'll also create a protected route that is accessible only to requests that contain a valid JWT."),t(),n(17,"p"),e(18,"We'll start with the first requirement: authenticating a user. We'll then extend that by issuing a JWT. Finally, we'll create a protected route that checks for a valid JWT on the request."),t(),n(19,"h4",17)(20,"span"),e(21,"Creating an authentication module"),t()(),n(22,"p"),e(23,"We'll start by generating an "),n(24,"code"),e(25,"AuthModule"),t(),e(26," and in it, an "),n(27,"code"),e(28,"AuthService"),t(),e(29," and an "),n(30,"code"),e(31,"AuthController"),t(),e(32,". We'll use the "),n(33,"code"),e(34,"AuthService"),t(),e(35," to implement the authentication logic, and the "),n(36,"code"),e(37,"AuthController"),t(),e(38," to expose the authentication endpoints."),t(),n(39,"pre")(40,"code",18),e(41,`
$ nest g module auth
$ nest g controller auth
$ nest g service auth
`),t()(),n(42,"p"),e(43,"As we implement the "),n(44,"code"),e(45,"AuthService"),t(),e(46,", we'll find it useful to encapsulate user operations in a "),n(47,"code"),e(48,"UsersService"),t(),e(49,", so let's generate that module and service now:"),t(),n(50,"pre")(51,"code",18),e(52,`
$ nest g module users
$ nest g service users
`),t()(),n(53,"p"),e(54,"Replace the default contents of these generated files as shown below. For our sample app, the "),n(55,"code"),e(56,"UsersService"),t(),e(57," simply maintains a hard-coded in-memory list of users, and a find method to retrieve one by username. In a real app, this is where you'd build your user model and persistence layer, using your library of choice (e.g., TypeORM, Sequelize, Mongoose, etc.)."),t(),n(58,"app-copy-button",19)(59,"span",20),e(60),m(61,"extension"),r(62,"app-tabs",null,1),t(),n(64,"pre")(65,"code",21),e(66,`
import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
`),t()(),n(67,"pre")(68,"code",21),e(69,`
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
`),t()()(),n(70,"p"),e(71,"In the "),n(72,"code"),e(73,"UsersModule"),t(),e(74,", the only change needed is to add the "),n(75,"code"),e(76,"UsersService"),t(),e(77," to the exports array of the "),n(78,"code"),e(79,"@Module"),t(),e(80," decorator so that it is visible outside this module (we'll soon use it in our "),n(81,"code"),e(82,"AuthService"),t(),e(83,")."),t(),n(84,"app-copy-button",19)(85,"span",20),e(86),m(87,"extension"),r(88,"app-tabs",null,2),t(),n(90,"pre")(91,"code",21),e(92,`
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`),t()(),n(93,"pre")(94,"code",21),e(95,`
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`),t()()(),n(96,"h4",22)(97,"span"),e(98,'Implementing the "Sign in" endpoint'),t()(),n(99,"p"),e(100,"Our "),n(101,"code"),e(102,"AuthService"),t(),e(103," has the job of retrieving a user and verifying the password. We create a "),n(104,"code"),e(105,"signIn()"),t(),e(106," method for this purpose. In the code below, we use a convenient ES6 spread operator to strip the password property from the user object before returning it. This is a common practice when returning user objects, as you don't want to expose sensitive fields like passwords or other security keys."),t(),n(107,"app-copy-button",19)(108,"span",20),e(109),m(110,"extension"),r(111,"app-tabs",null,3),t(),n(113,"pre")(114,"code",21),e(115,`
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
`),t()(),n(116,"pre")(117,"code",21),e(118,`
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return result;
  }
}
`),t()()(),n(119,"blockquote",23)(120,"strong"),e(121,"Warning"),t(),e(122," Of course in a real application, you wouldn't store a password in plain text. You'd instead use a library like "),n(123,"a",24),e(124,"bcrypt"),t(),e(125,", with a salted one-way hash algorithm. With that approach, you'd only store hashed passwords, and then compare the stored password to a hashed version of the "),n(126,"strong"),e(127,"incoming"),t(),e(128," password, thus never storing or exposing user passwords in plain text. To keep our sample app simple, we violate that absolute mandate and use plain text. "),n(129,"strong"),e(130,"Don't do this in your real app!"),t()(),n(131,"p"),e(132,"Now, we update our "),n(133,"code"),e(134,"AuthModule"),t(),e(135," to import the "),n(136,"code"),e(137,"UsersModule"),t(),e(138,"."),t(),n(139,"app-copy-button",19)(140,"span",20),e(141),m(142,"extension"),r(143,"app-tabs",null,4),t(),n(145,"pre")(146,"code",21),e(147,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
`),t()(),n(148,"pre")(149,"code",21),e(150,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
`),t()()(),n(151,"p"),e(152,"With this in place, let's open up the "),n(153,"code"),e(154,"AuthController"),t(),e(155," and add a "),n(156,"code"),e(157,"signIn()"),t(),e(158," method to it. This method will be called by the client to authenticate a user. It will receive the username and password in the request body, and will return a JWT token if the user is authenticated."),t(),n(159,"app-copy-button",19)(160,"span",20),e(161),m(162,"extension"),r(163,"app-tabs",null,5),t(),n(165,"pre")(166,"code",21),e(167,`
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
`),t()()(),n(168,"blockquote",25)(169,"strong"),e(170,"Hint"),t(),e(171," Ideally, instead of using the "),n(172,"code"),e(173,"Record<string, any>"),t(),e(174," type, we should use a DTO class to define the shape of the request body. See the "),n(175,"a",26),e(176,"validation"),t(),e(177,` chapter for more information.
`),t(),n(178,"p"),r(179,"app-banner-courses-auth"),t(),n(180,"h4",27)(181,"span"),e(182,"JWT token"),t()(),n(183,"p"),e(184,"We're ready to move on to the JWT portion of our auth system. Let's review and refine our requirements:"),t(),n(185,"ul")(186,"li"),e(187,"Allow users to authenticate with username/password, returning a JWT for use in subsequent calls to protected API endpoints. We're well on our way to meeting this requirement. To complete it, we'll need to write the code that issues a JWT."),t(),n(188,"li"),e(189,"Create API routes which are protected based on the presence of a valid JWT as a bearer token"),t()(),n(190,"p"),e(191,"We'll need to install one additional package to support our JWT requirements:"),t(),n(192,"pre")(193,"code",18),e(194,`
$ npm install --save @nestjs/jwt
`),t()(),n(195,"blockquote",25)(196,"strong"),e(197,"Hint"),t(),e(198," The "),n(199,"code"),e(200,"@nestjs/jwt"),t(),e(201," package (see more "),n(202,"a",28),e(203,"here"),t(),e(204,`) is a utility package that helps with JWT manipulation. This includes generating and verifying JWT tokens.
`),t(),n(205,"p"),e(206,"To keep our services cleanly modularized, we'll handle generating the JWT in the "),n(207,"code"),e(208,"authService"),t(),e(209,". Open the "),n(210,"code"),e(211,"auth.service.ts"),t(),e(212," file in the "),n(213,"code"),e(214,"auth"),t(),e(215," folder, inject the "),n(216,"code"),e(217,"JwtService"),t(),e(218,", and update the "),n(219,"code"),e(220,"signIn"),t(),e(221," method to generate a JWT token as shown below:"),t(),n(222,"app-copy-button",19)(223,"span",20),e(224),m(225,"extension"),r(226,"app-tabs",null,6),t(),n(228,"pre")(229,"code",21),e(230,`
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, username: user.username };
    return {
      // \u{1F4A1} Here the JWT secret key that's used for signing the payload 
      // is the key that was passed in the JwtModule
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
`),t()(),n(231,"pre")(232,"code",21),e(233,`
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      // \u{1F4A1} Here the JWT secret key that's used for signing the payload 
      // is the key that was passed in the JwtModule
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
`),t()()(),n(234,"p"),e(235,"We're using the "),n(236,"code"),e(237,"@nestjs/jwt"),t(),e(238," library, which supplies a "),n(239,"code"),e(240,"signAsync()"),t(),e(241," function to generate our JWT from a subset of the "),n(242,"code"),e(243,"user"),t(),e(244," object properties, which we then return as a simple object with a single "),n(245,"code"),e(246,"access_token"),t(),e(247," property. Note: we choose a property name of "),n(248,"code"),e(249,"sub"),t(),e(250," to hold our "),n(251,"code"),e(252,"userId"),t(),e(253," value to be consistent with JWT standards."),t(),n(254,"p"),e(255,"We now need to update the "),n(256,"code"),e(257,"AuthModule"),t(),e(258," to import the new dependencies and configure the "),n(259,"code"),e(260,"JwtModule"),t(),e(261,"."),t(),n(262,"p"),e(263,"First, create "),n(264,"code"),e(265,"constants.ts"),t(),e(266," in the "),n(267,"code"),e(268,"auth"),t(),e(269," folder, and add the following code:"),t(),n(270,"app-copy-button",19)(271,"span",20),e(272),m(273,"extension"),r(274,"app-tabs",null,7),t(),n(276,"pre")(277,"code",21),e(278,`
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
`),t()(),n(279,"pre")(280,"code",21),e(281,`
export const jwtConstants = {
  secret: 'DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.',
};
`),t()()(),n(282,"p"),e(283,"We'll use this to share our key between the JWT signing and verifying steps."),t(),n(284,"blockquote",23)(285,"strong"),e(286,"Warning"),t(),n(287,"strong"),e(288,"Do not expose this key publicly"),t(),e(289,". We have done so here to make it clear what the code is doing, but in a production system "),n(290,"strong"),e(291,"you must protect this key"),t(),e(292,` using appropriate measures such as a secrets vault, environment variable, or configuration service.
`),t(),n(293,"p"),e(294,"Now, open "),n(295,"code"),e(296,"auth.module.ts"),t(),e(297," in the "),n(298,"code"),e(299,"auth"),t(),e(300," folder and update it to look like this:"),t(),n(301,"app-copy-button",19)(302,"span",20),e(303),m(304,"extension"),r(305,"app-tabs",null,8),t(),n(307,"pre")(308,"code",21),e(309,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
`),t()(),n(310,"pre")(311,"code",21),e(312,`
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
`),t()()(),n(313,"blockquote",25)(314,"strong"),e(315,"Hint"),t(),e(316," We're registering the "),n(317,"code"),e(318,"JwtModule"),t(),e(319," as global to make things easier for us. This means that we don't need to import the "),n(320,"code"),e(321,"JwtModule"),t(),e(322,` anywhere else in our application.
`),t(),n(323,"p"),e(324,"We configure the "),n(325,"code"),e(326,"JwtModule"),t(),e(327," using "),n(328,"code"),e(329,"register()"),t(),e(330,", passing in a configuration object. See "),n(331,"a",29),e(332,"here"),t(),e(333," for more on the Nest "),n(334,"code"),e(335,"JwtModule"),t(),e(336," and "),n(337,"a",30),e(338,"here"),t(),e(339," for more details on the available configuration options."),t(),n(340,"p"),e(341,"Let's go ahead and test our routes using cURL again. You can test with any of the "),n(342,"code"),e(343,"user"),t(),e(344," objects hard-coded in the "),n(345,"code"),e(346,"UsersService"),t(),e(347,"."),t(),n(348,"pre")(349,"code",18),e(350,`
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Note: above JWT truncated
`),t()(),n(351,"h4",31)(352,"span"),e(353,"Implementing the authentication guard"),t()(),n(354,"p"),e(355,"We can now address our final requirement: protecting endpoints by requiring a valid JWT be present on the request. We'll do this by creating an "),n(356,"code"),e(357,"AuthGuard"),t(),e(358," that we can use to protect our routes."),t(),n(359,"app-copy-button",19)(360,"span",20),e(361),m(362,"extension"),r(363,"app-tabs",null,9),t(),n(365,"pre")(366,"code",21),e(367,`
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // \u{1F4A1} Here the JWT secret key that's used for verifying the payload 
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(token);
      // \u{1F4A1} We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
`),t()()(),n(368,"p"),e(369,"We can now implement our protected route and register our "),n(370,"code"),e(371,"AuthGuard"),t(),e(372," to protect it."),t(),n(373,"p"),e(374,"Open the "),n(375,"code"),e(376,"auth.controller.ts"),t(),e(377," file and update it as shown below:"),t(),n(378,"app-copy-button",19)(379,"span",20),e(380),m(381,"extension"),r(382,"app-tabs",null,10),t(),n(384,"pre")(385,"code",21),e(386,`
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
`),t()()(),n(387,"p"),e(388,"We're applying the "),n(389,"code"),e(390,"AuthGuard"),t(),e(391," that we just created to the "),n(392,"code"),e(393,"GET /profile"),t(),e(394," route so that it will be protected."),t(),n(395,"p"),e(396,"Ensure the app is running, and test the routes using "),n(397,"code"),e(398,"cURL"),t(),e(399,"."),t(),n(400,"pre")(401,"code",18),e(402,`
$ # GET /profile
$ curl http://localhost:3000/auth/profile
{"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}

$ # GET /profile using access_token returned from previous step as bearer code
$ curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
{"sub":1,"username":"john","iat":...,"exp":...}
`),t()(),n(403,"p"),e(404,"Note that in the "),n(405,"code"),e(406,"AuthModule"),t(),e(407,", we configured the JWT to have an expiration of "),n(408,"code"),e(409,"60 seconds"),t(),e(410,". This is too short an expiration, and dealing with the details of token expiration and refresh is beyond the scope of this article. However, we chose that to demonstrate an important quality of JWTs. If you wait 60 seconds after authenticating before attempting a "),n(411,"code"),e(412,"GET /auth/profile"),t(),e(413," request, you'll receive a "),n(414,"code"),e(415,"401 Unauthorized"),t(),e(416," response. This is because "),n(417,"code"),e(418,"@nestjs/jwt"),t(),e(419," automatically checks the JWT for its expiration time, saving you the trouble of doing so in your application."),t(),n(420,"p"),e(421,"We've now completed our JWT authentication implementation. JavaScript clients (such as Angular/React/Vue), and other JavaScript apps, can now authenticate and communicate securely with our API Server."),t(),n(422,"h4",32)(423,"span"),e(424,"Enable authentication globally"),t()(),n(425,"p"),e(426,"If the vast majority of your endpoints should be protected by default, you can register the authentication guard as a "),n(427,"a",33),e(428,"global guard"),t(),e(429," and instead of using "),n(430,"code"),e(431,"@UseGuards()"),t(),e(432," decorator on top of each controller, you could simply flag which routes should be public."),t(),n(433,"p"),e(434,"First, register the "),n(435,"code"),e(436,"AuthGuard"),t(),e(437," as a global guard using the following construction (in any module, for example, in the "),n(438,"code"),e(439,"AuthModule"),t(),e(440,"):"),t(),n(441,"app-copy-button")(442,"pre")(443,"code",21),e(444,`
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
],
`),t()()(),n(445,"p"),e(446,"With this in place, Nest will automatically bind "),n(447,"code"),e(448,"AuthGuard"),t(),e(449," to all endpoints."),t(),n(450,"p"),e(451,"Now we must provide a mechanism for declaring routes as public. For this, we can create a custom decorator using the "),n(452,"code"),e(453,"SetMetadata"),t(),e(454," decorator factory function."),t(),n(455,"app-copy-button")(456,"pre")(457,"code",21),e(458,`
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
`),t()()(),n(459,"p"),e(460,"In the file above, we exported two constants. One being our metadata key named "),n(461,"code"),e(462,"IS_PUBLIC_KEY"),t(),e(463,", and the other being our new decorator itself that we\u2019re going to call "),n(464,"code"),e(465,"Public"),t(),e(466," (you can alternatively name it "),n(467,"code"),e(468,"SkipAuth"),t(),e(469," or "),n(470,"code"),e(471,"AllowAnon"),t(),e(472,", whatever fits your project)."),t(),n(473,"p"),e(474,"Now that we have a custom "),n(475,"code"),e(476,"@Public()"),t(),e(477," decorator, we can use it to decorate any method, as follows:"),t(),n(478,"app-copy-button")(479,"pre")(480,"code",21),e(481,`
@Public()
@Get()
findAll() {
  return [];
}
`),t()()(),n(482,"p"),e(483,"Lastly, we need the "),n(484,"code"),e(485,"AuthGuard"),t(),e(486," to return "),n(487,"code"),e(488,"true"),t(),e(489," when the "),n(490,"code"),e(491,'"isPublic"'),t(),e(492," metadata is found. For this, we'll use the "),n(493,"code"),e(494,"Reflector"),t(),e(495," class (read more "),n(496,"a",34),e(497,"here"),t(),e(498,")."),t(),n(499,"app-copy-button")(500,"pre")(501,"code",21),e(502,`
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // \u{1F4A1} See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      // \u{1F4A1} Here the JWT secret key that's used for verifying the payload 
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(token);
      // \u{1F4A1} We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
`),t()()(),n(503,"h4",35)(504,"span"),e(505,"Passport integration"),t()(),n(506,"p")(507,"a",36),e(508,"Passport"),t(),e(509," is the most popular node.js authentication library, well-known by the community and successfully used in many production applications. It's straightforward to integrate this library with a "),n(510,"strong"),e(511,"Nest"),t(),e(512," application using the "),n(513,"code"),e(514,"@nestjs/passport"),t(),e(515," module."),t(),n(516,"p"),e(517,"To learn how you can integrate Passport with NestJS, check out this "),n(518,"a",37),e(519,"chapter"),t(),e(520,"."),t(),n(521,"h4",38)(522,"span"),e(523,"Example"),t()(),n(524,"p"),e(525,"You can find a complete version of the code in this chapter "),n(526,"a",39),e(527,"here"),t(),e(528,"."),t()()),s&2){let v=d(63),b=d(89),y=d(112),w=d(144),T=d(164),R=d(227),P=d(275),q=d(306),B=d(364),W=d(383);i(60),c(" ",p(61,38,"users/users.service",v.isJsActive),`
`),i(4),l("hide",v.isJsActive),i(3),l("hide",!v.isJsActive),i(19),c(" ",p(87,41,"users/users.module",b.isJsActive),`
`),i(4),l("hide",b.isJsActive),i(3),l("hide",!b.isJsActive),i(16),c(" ",p(110,44,"auth/auth.service",y.isJsActive),`
`),i(4),l("hide",y.isJsActive),i(3),l("hide",!y.isJsActive),i(25),c(" ",p(142,47,"auth/auth.module",w.isJsActive),`
`),i(4),l("hide",w.isJsActive),i(3),l("hide",!w.isJsActive),i(13),c(" ",p(162,50,"auth/auth.controller",T.isJsActive),`
`),i(63),c(" ",p(225,53,"auth/auth.service",R.isJsActive),`
`),i(4),l("hide",R.isJsActive),i(3),l("hide",!R.isJsActive),i(41),c(" ",p(273,56,"auth/constants",P.isJsActive),`
`),i(4),l("hide",P.isJsActive),i(3),l("hide",!P.isJsActive),i(24),c(" ",p(304,59,"auth/auth.module",q.isJsActive),`
`),i(4),l("hide",q.isJsActive),i(3),l("hide",!q.isJsActive),i(51),c(" ",p(362,62,"auth/auth.guard",B.isJsActive),`
`),i(19),c(" ",p(381,65,"auth.controller",W.isJsActive),`
`)}},dependencies:[g,E,A,j,I,k],encapsulation:2,changeDetection:0})}return o})();var H=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-authorization"]],features:[f],decls:615,vars:36,consts:[["contentReference",""],["appd4311ee045ae5c014c6d79ddfdd053317e19bb8c",""],["app17579d3b95d0c9ecf9c734fd2067099591b87ffd",""],["app6ba9e023ddec36925f1d3f239633967e996896e2",""],["app8ea99825b65981087151334a1781b600cc383a35",""],["app9bcd7d5883b8ff082baada4d1b0e963629de4611",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/authorization.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","authorization"],["appAnchor","","id","basic-rbac-implementation"],["routerLink","/guards"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],[1,"info"],["href","/fundamentals/execution-context#reflection-and-metadata"],[1,"warning"],["routerLink","/security/authentication"],["appAnchor","","id","claims-based-authorization"],["href","/security/authorization#basic-rbac-implementation"],["appAnchor","","id","integrating-casl"],["rel","nofollow","target","_blank","href","https://casl.js.org/"],[1,"language-bash"],["rel","nofollow","target","_blank","href","https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types"],["rel","nofollow","target","_blank","href","https://casl.js.org/v6/en/guide/intro"],["appAnchor","","id","advanced-implementing-a-policiesguard"],["routerLink","/fundamentals/module-ref"]],template:function(s,u){if(s&1&&(n(0,"div",6,0)(2,"div",7)(3,"a",8),r(4,"i",9),t()(),n(5,"h3",10),e(6,"Authorization"),t(),n(7,"p")(8,"strong"),e(9,"Authorization"),t(),e(10," refers to the process that determines what a user is able to do. For example, an administrative user is allowed to create, edit, and delete posts. A non-administrative user is only authorized to read the posts."),t(),n(11,"p"),e(12,"Authorization is orthogonal and independent from authentication. However, authorization requires an authentication mechanism."),t(),n(13,"p"),e(14,"There are many different approaches and strategies to handle authorization. The approach taken for any project depends on its particular application requirements. This chapter presents a few approaches to authorization that can be adapted to a variety of different requirements."),t(),n(15,"h4",11)(16,"span"),e(17,"Basic RBAC implementation"),t()(),n(18,"p"),e(19,"Role-based access control ("),n(20,"strong"),e(21,"RBAC"),t(),e(22,") is a policy-neutral access-control mechanism defined around roles and privileges. In this section, we'll demonstrate how to implement a very basic RBAC mechanism using Nest "),n(23,"a",12),e(24,"guards"),t(),e(25,"."),t(),n(26,"p"),e(27,"First, let's create a "),n(28,"code"),e(29,"Role"),t(),e(30," enum representing roles in the system:"),t(),n(31,"app-copy-button",13)(32,"span",14),e(33),m(34,"extension"),r(35,"app-tabs",null,1),t(),n(37,"pre")(38,"code",15),e(39,`
export enum Role {
  User = 'user',
  Admin = 'admin',
}
`),t()()(),n(40,"blockquote",16)(41,"strong"),e(42,"Hint"),t(),e(43,` In more sophisticated systems, you may store roles within a database, or pull them from the external authentication provider.
`),t(),n(44,"p"),e(45,"With this in place, we can create a "),n(46,"code"),e(47,"@Roles()"),t(),e(48," decorator. This decorator allows specifying what roles are required to access specific resources."),t(),n(49,"app-copy-button",13)(50,"span",14),e(51),m(52,"extension"),r(53,"app-tabs",null,2),t(),n(55,"pre")(56,"code",15),e(57,`
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
`),t()(),n(58,"pre")(59,"code",15),e(60,`
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
`),t()()(),n(61,"p"),e(62,"Now that we have a custom "),n(63,"code"),e(64,"@Roles()"),t(),e(65," decorator, we can use it to decorate any route handler."),t(),n(66,"app-copy-button",13)(67,"span",14),e(68),m(69,"extension"),r(70,"app-tabs",null,3),t(),n(72,"pre")(73,"code",15),e(74,`
@Post()
@Roles(Role.Admin)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()(),n(75,"pre")(76,"code",15),e(77,`
@Post()
@Roles(Role.Admin)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(78,"p"),e(79,"Finally, we create a "),n(80,"code"),e(81,"RolesGuard"),t(),e(82," class which will compare the roles assigned to the current user to the actual roles required by the current route being processed. In order to access the route's role(s) (custom metadata), we'll use the "),n(83,"code"),e(84,"Reflector"),t(),e(85," helper class, which is provided out of the box by the framework and exposed from the "),n(86,"code"),e(87,"@nestjs/core"),t(),e(88," package."),t(),n(89,"app-copy-button",13)(90,"span",14),e(91),m(92,"extension"),r(93,"app-tabs",null,4),t(),n(95,"pre")(96,"code",15),e(97,`
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
`),t()(),n(98,"pre")(99,"code",15),e(100,`
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
`),t()()(),n(101,"blockquote",16)(102,"strong"),e(103,"Hint"),t(),e(104," Refer to the "),n(105,"a",17),e(106,"Reflection and metadata"),t(),e(107," section of the Execution context chapter for more details on utilizing "),n(108,"code"),e(109,"Reflector"),t(),e(110,` in a context-sensitive way.
`),t(),n(111,"blockquote",18)(112,"strong"),e(113,"Notice"),t(),e(114,' This example is named "'),n(115,"strong"),e(116,"basic"),t(),e(117,`" as we only check for the presence of roles on the route handler level. In real-world applications, you may have endpoints/handlers that involve several operations, in which each of them requires a specific set of permissions. In this case, you'll have to provide a mechanism to check roles somewhere within your business-logic, making it somewhat harder to maintain as there will be no centralized place that associates permissions with specific actions.
`),t(),n(118,"p"),e(119,"In this example, we assumed that "),n(120,"code"),e(121,"request.user"),t(),e(122," contains the user instance and allowed roles (under the "),n(123,"code"),e(124,"roles"),t(),e(125," property). In your app, you will probably make that association in your custom "),n(126,"strong"),e(127,"authentication guard"),t(),e(128," - see "),n(129,"a",19),e(130,"authentication"),t(),e(131," chapter for more details."),t(),n(132,"p"),e(133,"To make sure this example works, your "),n(134,"code"),e(135,"User"),t(),e(136," class must look as follows:"),t(),n(137,"app-copy-button")(138,"pre")(139,"code",15),e(140,`
class User {
  // ...other properties
  roles: Role[];
}
`),t()()(),n(141,"p"),e(142,"Lastly, make sure to register the "),n(143,"code"),e(144,"RolesGuard"),t(),e(145,", for example, at the controller level, or globally:"),t(),n(146,"app-copy-button")(147,"pre")(148,"code",15),e(149,`
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
`),t()()(),n(150,"p"),e(151,"When a user with insufficient privileges requests an endpoint, Nest automatically returns the following response:"),t(),n(152,"app-copy-button")(153,"pre")(154,"code",15),e(155,`
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
`),t()()(),n(156,"blockquote",16)(157,"strong"),e(158,"Hint"),t(),e(159,` If you want to return a different error response, you should throw your own specific exception instead of returning a boolean value.
`),t(),n(160,"p"),r(161,"app-banner-courses-auth"),t(),n(162,"h4",20)(163,"span"),e(164,"Claims-based authorization"),t()(),n(165,"p"),e(166,"When an identity is created it may be assigned one or more claims issued by a trusted party. A claim is a name-value pair that represents what the subject can do, not what the subject is."),t(),n(167,"p"),e(168,"To implement a Claims-based authorization in Nest, you can follow the same steps we have shown above in the "),n(169,"a",21),e(170,"RBAC"),t(),e(171," section with one significant difference: instead of checking for specific roles, you should compare "),n(172,"strong"),e(173,"permissions"),t(),e(174,". Every user would have a set of permissions assigned. Likewise, each resource/endpoint would define what permissions are required (for example, through a dedicated "),n(175,"code"),e(176,"@RequirePermissions()"),t(),e(177," decorator) to access them."),t(),n(178,"app-copy-button",13)(179,"span",14),e(180),m(181,"extension"),r(182,"app-tabs",null,5),t(),n(184,"pre")(185,"code",15),e(186,`
@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
`),t()(),n(187,"pre")(188,"code",15),e(189,`
@Post()
@RequirePermissions(Permission.CREATE_CAT)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
`),t()()(),n(190,"blockquote",16)(191,"strong"),e(192,"Hint"),t(),e(193," In the example above, "),n(194,"code"),e(195,"Permission"),t(),e(196," (similar to "),n(197,"code"),e(198,"Role"),t(),e(199,` we have shown in RBAC section) is a TypeScript enum that contains all the permissions available in your system.
`),t(),n(200,"h4",22)(201,"span"),e(202,"Integrating CASL"),t()(),n(203,"p")(204,"a",23),e(205,"CASL"),t(),e(206," is an isomorphic authorization library which restricts what resources a given client is allowed to access. It's designed to be incrementally adoptable and can easily scale between a simple claim based and fully featured subject and attribute based authorization."),t(),n(207,"p"),e(208,"To start, first install the "),n(209,"code"),e(210,"@casl/ability"),t(),e(211," package:"),t(),n(212,"pre")(213,"code",24),e(214,`
$ npm i @casl/ability
`),t()(),n(215,"blockquote",16)(216,"strong"),e(217,"Hint"),t(),e(218," In this example, we chose CASL, but you can use any other library like "),n(219,"code"),e(220,"accesscontrol"),t(),e(221," or "),n(222,"code"),e(223,"acl"),t(),e(224,`, depending on your preferences and project needs.
`),t(),n(225,"p"),e(226,"Once the installation is complete, for the sake of illustrating the mechanics of CASL, we'll define two entity classes: "),n(227,"code"),e(228,"User"),t(),e(229," and "),n(230,"code"),e(231,"Article"),t(),e(232,"."),t(),n(233,"app-copy-button")(234,"pre")(235,"code",15),e(236,`
class User {
  id: number;
  isAdmin: boolean;
}
`),t()()(),n(237,"p")(238,"code"),e(239,"User"),t(),e(240," class consists of two properties, "),n(241,"code"),e(242,"id"),t(),e(243,", which is a unique user identifier, and "),n(244,"code"),e(245,"isAdmin"),t(),e(246,", indicating whether a user has administrator privileges."),t(),n(247,"app-copy-button")(248,"pre")(249,"code",15),e(250,`
class Article {
  id: number;
  isPublished: boolean;
  authorId: number;
}
`),t()()(),n(251,"p")(252,"code"),e(253,"Article"),t(),e(254," class has three properties, respectively "),n(255,"code"),e(256,"id"),t(),e(257,", "),n(258,"code"),e(259,"isPublished"),t(),e(260,", and "),n(261,"code"),e(262,"authorId"),t(),e(263,". "),n(264,"code"),e(265,"id"),t(),e(266," is a unique article identifier, "),n(267,"code"),e(268,"isPublished"),t(),e(269," indicates whether an article was already published or not, and "),n(270,"code"),e(271,"authorId"),t(),e(272,", which is an ID of a user who wrote the article."),t(),n(273,"p"),e(274,"Now let's review and refine our requirements for this example:"),t(),n(275,"ul")(276,"li"),e(277,"Admins can manage (create/read/update/delete) all entities"),t(),n(278,"li"),e(279,"Users have read-only access to everything"),t(),n(280,"li"),e(281,"Users can update their articles ("),n(282,"code"),e(283,"article.authorId === userId"),t(),e(284,")"),t(),n(285,"li"),e(286,"Articles that are published already cannot be removed ("),n(287,"code"),e(288,"article.isPublished === true"),t(),e(289,")"),t()(),n(290,"p"),e(291,"With this in mind, we can start off by creating an "),n(292,"code"),e(293,"Action"),t(),e(294," enum representing all possible actions that the users can perform with entities:"),t(),n(295,"app-copy-button")(296,"pre")(297,"code",15),e(298,`
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
`),t()()(),n(299,"blockquote",18)(300,"strong"),e(301,"Notice"),t(),n(302,"code"),e(303,"manage"),t(),e(304,` is a special keyword in CASL which represents "any action".
`),t(),n(305,"p"),e(306,"To encapsulate CASL library, let's generate the "),n(307,"code"),e(308,"CaslModule"),t(),e(309," and "),n(310,"code"),e(311,"CaslAbilityFactory"),t(),e(312," now."),t(),n(313,"pre")(314,"code",24),e(315,`
$ nest g module casl
$ nest g class casl/casl-ability.factory
`),t()(),n(316,"p"),e(317,"With this in place, we can define the "),n(318,"code"),e(319,"createForUser()"),t(),e(320," method on the "),n(321,"code"),e(322,"CaslAbilityFactory"),t(),e(323,". This method will create the "),n(324,"code"),e(325,"Ability"),t(),e(326," object for a given user:"),t(),n(327,"app-copy-button")(328,"pre")(329,"code",15),e(330,`
type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    if (user.isAdmin) {
      can(Action.Manage, 'all'); // read-write access to everything
    } else {
      can(Action.Read, 'all'); // read-only access to everything
    }

    can(Action.Update, Article, { authorId: user.id });
    cannot(Action.Delete, Article, { isPublished: true });

    return build({
      // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
`),t()()(),n(331,"blockquote",18)(332,"strong"),e(333,"Notice"),t(),n(334,"code"),e(335,"all"),t(),e(336,` is a special keyword in CASL that represents "any subject".
`),t(),n(337,"blockquote",16)(338,"strong"),e(339,"Hint"),t(),e(340," Since CASL v6, "),n(341,"code"),e(342,"MongoAbility"),t(),e(343," serves as the default ability class, replacing the legacy "),n(344,"code"),e(345,"Ability"),t(),e(346,` to better support condition-based permissions using MongoDB-like syntax. Despite the name, it is not tied to MongoDB \u2014 it works with any kind of data by simply comparing objects against conditions written in Mongo-like syntax.
`),t(),n(347,"blockquote",16)(348,"strong"),e(349,"Hint"),t(),n(350,"code"),e(351,"MongoAbility"),t(),e(352,", "),n(353,"code"),e(354,"AbilityBuilder"),t(),e(355,", "),n(356,"code"),e(357,"AbilityClass"),t(),e(358,", and "),n(359,"code"),e(360,"ExtractSubjectType"),t(),e(361," classes are exported from the "),n(362,"code"),e(363,"@casl/ability"),t(),e(364,` package.
`),t(),n(365,"blockquote",16)(366,"strong"),e(367,"Hint"),t(),e(368," The "),n(369,"code"),e(370,"detectSubjectType"),t(),e(371," option lets CASL understand how to get the subject type out of an object. For more information, read the "),n(372,"a",25),e(373,"CASL documentation"),t(),e(374,`.
`),t(),n(375,"p"),e(376,"In the example above, we created the "),n(377,"code"),e(378,"MongoAbility"),t(),e(379," instance using the "),n(380,"code"),e(381,"AbilityBuilder"),t(),e(382," class. As you probably guessed, "),n(383,"code"),e(384,"can"),t(),e(385," and "),n(386,"code"),e(387,"cannot"),t(),e(388," accept the same arguments but have different meanings, "),n(389,"code"),e(390,"can"),t(),e(391," allows you to perform an action on the specified subject and "),n(392,"code"),e(393,"cannot"),t(),e(394," forbids it. Both may accept up to 4 arguments. To learn more about these functions, visit the official "),n(395,"a",26),e(396,"CASL documentation"),t(),e(397,"."),t(),n(398,"p"),e(399,"Lastly, make sure to add the "),n(400,"code"),e(401,"CaslAbilityFactory"),t(),e(402," to the "),n(403,"code"),e(404,"providers"),t(),e(405," and "),n(406,"code"),e(407,"exports"),t(),e(408," arrays in the "),n(409,"code"),e(410,"CaslModule"),t(),e(411," module definition:"),t(),n(412,"app-copy-button")(413,"pre")(414,"code",15),e(415,`
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
`),t()()(),n(416,"p"),e(417,"With this in place, we can inject the "),n(418,"code"),e(419,"CaslAbilityFactory"),t(),e(420," to any class using standard constructor injection as long as the "),n(421,"code"),e(422,"CaslModule"),t(),e(423," is imported in the host context:"),t(),n(424,"app-copy-button")(425,"pre")(426,"code",15),e(427,`
constructor(private caslAbilityFactory: CaslAbilityFactory) {}
`),t()()(),n(428,"p"),e(429,"Then use it in a class as follows."),t(),n(430,"app-copy-button")(431,"pre")(432,"code",15),e(433,`
const ability = this.caslAbilityFactory.createForUser(user);
if (ability.can(Action.Read, 'all')) {
  // "user" has read access to everything
}
`),t()()(),n(434,"blockquote",16)(435,"strong"),e(436,"Hint"),t(),e(437," Learn more about the "),n(438,"code"),e(439,"MongoAbility"),t(),e(440," class in the official "),n(441,"a",26),e(442,"CASL documentation"),t(),e(443,`.
`),t(),n(444,"p"),e(445,"For example, let's say we have a user who is not an admin. In this case, the user should be able to read articles, but creating new ones or removing the existing articles should be prohibited."),t(),n(446,"app-copy-button")(447,"pre")(448,"code",15),e(449,`
const user = new User();
user.isAdmin = false;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Read, Article); // true
ability.can(Action.Delete, Article); // false
ability.can(Action.Create, Article); // false
`),t()()(),n(450,"blockquote",16)(451,"strong"),e(452,"Hint"),t(),e(453," Although both "),n(454,"code"),e(455,"MongoAbility"),t(),e(456," and "),n(457,"code"),e(458,"AbilityBuilder"),t(),e(459," classes provide "),n(460,"code"),e(461,"can"),t(),e(462," and "),n(463,"code"),e(464,"cannot"),t(),e(465,` methods, they have different purposes and accept slightly different arguments.
`),t(),n(466,"p"),e(467,"Also, as we have specified in our requirements, the user should be able to update its articles:"),t(),n(468,"app-copy-button")(469,"pre")(470,"code",15),e(471,`
const user = new User();
user.id = 1;

const article = new Article();
article.authorId = user.id;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Update, article); // true

article.authorId = 2;
ability.can(Action.Update, article); // false
`),t()()(),n(472,"p"),e(473,"As you can see, "),n(474,"code"),e(475,"MongoAbility"),t(),e(476," instance allows us to check permissions in pretty readable way. Likewise, "),n(477,"code"),e(478,"AbilityBuilder"),t(),e(479," allows us to define permissions (and specify various conditions) in a similar fashion. To find more examples, visit the official documentation."),t(),n(480,"h4",27)(481,"span"),e(482,"Advanced: Implementing a "),n(483,"code"),e(484,"PoliciesGuard"),t()()(),n(485,"p"),e(486,"In this section, we'll demonstrate how to build a somewhat more sophisticated guard, which checks if a user meets specific "),n(487,"strong"),e(488,"authorization policies"),t(),e(489," that can be configured on the method-level (you can extend it to respect policies configured on the class-level too). In this example, we are going to use the CASL package just for illustration purposes, but using this library is not required. Also, we will use the "),n(490,"code"),e(491,"CaslAbilityFactory"),t(),e(492," provider that we've created in the previous section."),t(),n(493,"p"),e(494,"First, let's flesh out the requirements. The goal is to provide a mechanism that allows specifying policy checks per route handler. We will support both objects and functions (for simpler checks and for those who prefer more functional-style code)."),t(),n(495,"p"),e(496,"Let's start off by defining interfaces for policy handlers:"),t(),n(497,"app-copy-button")(498,"pre")(499,"code",15),e(500,`
import { AppAbility } from '../casl/casl-ability.factory';

interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
`),t()()(),n(501,"p"),e(502,"As mentioned above, we provided two possible ways of defining a policy handler, an object (instance of a class that implements the "),n(503,"code"),e(504,"IPolicyHandler"),t(),e(505," interface) and a function (which meets the "),n(506,"code"),e(507,"PolicyHandlerCallback"),t(),e(508," type)."),t(),n(509,"p"),e(510,"With this in place, we can create a "),n(511,"code"),e(512,"@CheckPolicies()"),t(),e(513," decorator. This decorator allows specifying what policies have to be met to access specific resources."),t(),n(514,"app-copy-button")(515,"pre")(516,"code",15),e(517,`
export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
`),t()()(),n(518,"p"),e(519,"Now let's create a "),n(520,"code"),e(521,"PoliciesGuard"),t(),e(522," that will extract and execute all the policy handlers bound to a route handler."),t(),n(523,"app-copy-button")(524,"pre")(525,"code",15),e(526,`
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
`),t()()(),n(527,"blockquote",16)(528,"strong"),e(529,"Hint"),t(),e(530," In this example, we assumed that "),n(531,"code"),e(532,"request.user"),t(),e(533," contains the user instance. In your app, you will probably make that association in your custom "),n(534,"strong"),e(535,"authentication guard"),t(),e(536," - see "),n(537,"a",19),e(538,"authentication"),t(),e(539,` chapter for more details.
`),t(),n(540,"p"),e(541,"Let's break this example down. The "),n(542,"code"),e(543,"policyHandlers"),t(),e(544," is an array of handlers assigned to the method through the "),n(545,"code"),e(546,"@CheckPolicies()"),t(),e(547," decorator. Next, we use the "),n(548,"code"),e(549,"CaslAbilityFactory#create"),t(),e(550," method which constructs the "),n(551,"code"),e(552,"Ability"),t(),e(553," object, allowing us to verify whether a user has sufficient permissions to perform specific actions. We are passing this object to the policy handler which is either a function or an instance of a class that implements the "),n(554,"code"),e(555,"IPolicyHandler"),t(),e(556,", exposing the "),n(557,"code"),e(558,"handle()"),t(),e(559," method that returns a boolean. Lastly, we use the "),n(560,"code"),e(561,"Array#every"),t(),e(562," method to make sure that every handler returned "),n(563,"code"),e(564,"true"),t(),e(565," value."),t(),n(566,"p"),e(567,"Finally, to test this guard, bind it to any route handler, and register an inline policy handler (functional approach), as follows:"),t(),n(568,"app-copy-button")(569,"pre")(570,"code",15),e(571,`
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
findAll() {
  return this.articlesService.findAll();
}
`),t()()(),n(572,"p"),e(573,"Alternatively, we can define a class which implements the "),n(574,"code"),e(575,"IPolicyHandler"),t(),e(576," interface:"),t(),n(577,"app-copy-button")(578,"pre")(579,"code",15),e(580,`
export class ReadArticlePolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, Article);
  }
}
`),t()()(),n(581,"p"),e(582,"And use it as follows:"),t(),n(583,"app-copy-button")(584,"pre")(585,"code",15),e(586,`
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies(new ReadArticlePolicyHandler())
findAll() {
  return this.articlesService.findAll();
}
`),t()()(),n(587,"blockquote",18)(588,"strong"),e(589,"Notice"),t(),e(590," Since we must instantiate the policy handler in-place using the "),n(591,"code"),e(592,"new"),t(),e(593," keyword, "),n(594,"code"),e(595,"ReadArticlePolicyHandler"),t(),e(596," class cannot use the Dependency Injection. This can be addressed with the "),n(597,"code"),e(598,"ModuleRef#get"),t(),e(599," method (read more "),n(600,"a",28),e(601,"here"),t(),e(602,"). Basically, instead of registering functions and instances through the "),n(603,"code"),e(604,"@CheckPolicies()"),t(),e(605," decorator, you must allow passing a "),n(606,"code"),e(607,"Type<IPolicyHandler>"),t(),e(608,". Then, inside your guard, you could retrieve an instance using a type reference: "),n(609,"code"),e(610,"moduleRef.get(YOUR_HANDLER_TYPE)"),t(),e(611," or even dynamically instantiate it using the "),n(612,"code"),e(613,"ModuleRef#create"),t(),e(614,` method.
`),t()()),s&2){let v=d(36),b=d(54),y=d(71),w=d(94),T=d(183);i(33),c(" ",p(34,21,"role.enum",v.isJsActive),`
`),i(18),c(" ",p(52,24,"roles.decorator",b.isJsActive),`
`),i(4),l("hide",b.isJsActive),i(3),l("hide",!b.isJsActive),i(10),c(" ",p(69,27,"cats.controller",y.isJsActive),`
`),i(4),l("hide",y.isJsActive),i(3),l("hide",!y.isJsActive),i(16),c(" ",p(92,30,"roles.guard",w.isJsActive),`
`),i(4),l("hide",w.isJsActive),i(3),l("hide",!w.isJsActive),i(82),c(" ",p(181,33,"cats.controller",T.isJsActive),`
`),i(4),l("hide",T.isJsActive),i(3),l("hide",!T.isJsActive)}},dependencies:[g,j,E,A,I,k],encapsulation:2,changeDetection:0})}return o})();var U=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-cors"]],features:[f],decls:62,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/cors.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","cors"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/cors"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify-cors"],["appAnchor","","id","getting-started"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/cors#configuration-options"],["rel","nofollow","target","_blank","href","https://github.com/expressjs/cors#configuring-cors-asynchronously"]],template:function(s,u){s&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"CORS"),t(),n(7,"p"),e(8,"Cross-origin resource sharing (CORS) is a mechanism that allows resources to be requested from another domain. Under the hood, Nest makes use of the Express "),n(9,"a",6),e(10,"cors"),t(),e(11," or Fastify "),n(12,"a",7),e(13,"@fastify/cors"),t(),e(14," packages depending on the underlying platform. These packages provide various options that you can customize based on your requirements."),t(),n(15,"h4",8)(16,"span"),e(17,"Getting started"),t()(),n(18,"p"),e(19,"To enable CORS, call the "),n(20,"code"),e(21,"enableCors()"),t(),e(22," method on the Nest application object."),t(),n(23,"app-copy-button")(24,"pre")(25,"code",9),e(26,`
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(process.env.PORT ?? 3000);
`),t()()(),n(27,"p"),e(28,"The "),n(29,"code"),e(30,"enableCors()"),t(),e(31," method takes an optional configuration object argument. The available properties of this object are described in the official "),n(32,"a",10),e(33,"CORS"),t(),e(34," documentation. Another way is to pass a "),n(35,"a",11),e(36,"callback function"),t(),e(37," that lets you define the configuration object asynchronously based on the request (on the fly)."),t(),n(38,"p"),e(39,"Alternatively, enable CORS via the "),n(40,"code"),e(41,"create()"),t(),e(42," method's options object. Set the "),n(43,"code"),e(44,"cors"),t(),e(45," property to "),n(46,"code"),e(47,"true"),t(),e(48,` to enable CORS with default settings.
Or, pass a `),n(49,"a",10),e(50,"CORS configuration object"),t(),e(51," or "),n(52,"a",11),e(53,"callback function"),t(),e(54," as the "),n(55,"code"),e(56,"cors"),t(),e(57," property value to customize its behavior."),t(),n(58,"app-copy-button")(59,"pre")(60,"code",9),e(61,`
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(process.env.PORT ?? 3000);
`),t()()()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return o})();var J=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-csrf"]],features:[f],decls:69,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/csrf.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","csrf-protection"],["rel","nofollow","target","_blank","href","https://github.com/Psifi-Solutions/csrf-csrf"],["appAnchor","","id","use-with-express-default"],[1,"language-bash"],[1,"warning"],["rel","nofollow","target","_blank","href","https://github.com/Psifi-Solutions/csrf-csrf?tab=readme-ov-file#getting-started"],[1,"language-typescript"],["appAnchor","","id","use-with-fastify"],["rel","nofollow","target","_blank","href","https://github.com/fastify/csrf-protection#usage"]],template:function(s,u){s&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"CSRF Protection"),t(),n(7,"p"),e(8,"Cross-site request forgery (CSRF or XSRF) is a type of attack where "),n(9,"strong"),e(10,"unauthorized"),t(),e(11," commands are sent from a trusted user to a web application. To help prevent this, you can use the "),n(12,"a",6),e(13,"csrf-csrf"),t(),e(14," package."),t(),n(15,"h4",7)(16,"span"),e(17,"Use with Express (default)"),t()(),n(18,"p"),e(19,"Start by installing the required package:"),t(),n(20,"pre")(21,"code",8),e(22,`
$ npm i csrf-csrf
`),t()(),n(23,"blockquote",9)(24,"strong"),e(25,"Warning"),t(),e(26," As noted in the "),n(27,"a",10),e(28,"csrf-csrf documentation"),t(),e(29,", this middleware requires session middleware or "),n(30,"code"),e(31,"cookie-parser"),t(),e(32,` to be initialized beforehand. Please refer to the documentation for further details.
`),t(),n(33,"p"),e(34,"Once the installation is complete, register the "),n(35,"code"),e(36,"csrf-csrf"),t(),e(37," middleware as global middleware."),t(),n(38,"app-copy-button")(39,"pre")(40,"code",11),e(41,`
import { doubleCsrf } from 'csrf-csrf';
// ...
// somewhere in your initialization file
const {
  invalidCsrfTokenError, // This is provided purely for convenience if you plan on creating your own middleware.
  generateToken, // Use this in your routes to generate and provide a CSRF hash, along with a token cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf(doubleCsrfOptions);
app.use(doubleCsrfProtection);
`),t()()(),n(42,"h4",12)(43,"span"),e(44,"Use with Fastify"),t()(),n(45,"p"),e(46,"Start by installing the required package:"),t(),n(47,"pre")(48,"code",8),e(49,`
$ npm i --save @fastify/csrf-protection
`),t()(),n(50,"p"),e(51,"Once the installation is complete, register the "),n(52,"code"),e(53,"@fastify/csrf-protection"),t(),e(54," plugin, as follows:"),t(),n(55,"app-copy-button")(56,"pre")(57,"code",11),e(58,`
import fastifyCsrf from '@fastify/csrf-protection';
// ...
// somewhere in your initialization file after registering some storage plugin
await app.register(fastifyCsrf);
`),t()()(),n(59,"blockquote",9)(60,"strong"),e(61,"Warning"),t(),e(62," As explained in the "),n(63,"code"),e(64,"@fastify/csrf-protection"),t(),e(65," docs "),n(66,"a",13),e(67,"here"),t(),e(68,`, this plugin requires a storage plugin to be initialized first. Please, see that documentation for further instructions.
`),t()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return o})();var F=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-encryption-hashing"]],features:[f],decls:94,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/encryption-hashing.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","encryption-and-hashing"],["appAnchor","","id","encryption"],["rel","nofollow","target","_blank","href","https://nodejs.org/api/crypto.html"],[1,"language-typescript"],["appAnchor","","id","hashing"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/bcrypt"],["rel","nofollow","target","_blank","href","https://www.npmjs.com/package/argon2"],[1,"language-shell"]],template:function(s,u){s&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"Encryption and Hashing"),t(),n(7,"p")(8,"strong"),e(9,"Encryption"),t(),e(10," is the process of encoding information. This process converts the original representation of the information, known as plaintext, into an alternative form known as ciphertext. Ideally, only authorized parties can decipher a ciphertext back to plaintext and access the original information. Encryption does not itself prevent interference but denies the intelligible content to a would-be interceptor. Encryption is a two-way function; what is encrypted can be decrypted with the proper key."),t(),n(11,"p")(12,"strong"),e(13,"Hashing"),t(),e(14," is the process of converting a given key into another value. A hash function is used to generate the new value according to a mathematical algorithm. Once hashing has been done, it should be impossible to go from the output to the input."),t(),n(15,"h4",6)(16,"span"),e(17,"Encryption"),t()(),n(18,"p"),e(19,"Node.js provides a built-in "),n(20,"a",7),e(21,"crypto module"),t(),e(22," that you can use to encrypt and decrypt strings, numbers, buffers, streams, and more. Nest itself does not provide any additional package on top of this module to avoid introducing unnecessary abstractions."),t(),n(23,"p"),e(24,"As an example, let's use AES (Advanced Encryption System) "),n(25,"code"),e(26,"'aes-256-ctr'"),t(),e(27," algorithm CTR encryption mode."),t(),n(28,"app-copy-button")(29,"pre")(30,"code",8),e(31,`
import { createCipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const iv = randomBytes(16);
const password = 'Password used to generate key';

// The key length is dependent on the algorithm.
// In this case for aes256, it is 32 bytes.
const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const textToEncrypt = 'Nest';
const encryptedText = Buffer.concat([
  cipher.update(textToEncrypt),
  cipher.final(),
]);
`),t()()(),n(32,"p"),e(33,"Now to decrypt "),n(34,"code"),e(35,"encryptedText"),t(),e(36," value:"),t(),n(37,"app-copy-button")(38,"pre")(39,"code",8),e(40,`
import { createDecipheriv } from 'node:crypto';

const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([
  decipher.update(encryptedText),
  decipher.final(),
]);
`),t()()(),n(41,"h4",9)(42,"span"),e(43,"Hashing"),t()(),n(44,"p"),e(45,"For hashing, we recommend using either the "),n(46,"a",10),e(47,"bcrypt"),t(),e(48," or "),n(49,"a",11),e(50,"argon2"),t(),e(51," packages. Nest itself does not provide any additional wrappers on top of these modules to avoid introducing unnecessary abstractions (making the learning curve short)."),t(),n(52,"p"),e(53,"As an example, let's use "),n(54,"code"),e(55,"bcrypt"),t(),e(56," to hash a random password."),t(),n(57,"p"),e(58,"First install required packages:"),t(),n(59,"pre")(60,"code",12),e(61,`
$ npm i bcrypt
$ npm i -D @types/bcrypt
`),t()(),n(62,"p"),e(63,"Once the installation is complete, you can use the "),n(64,"code"),e(65,"hash"),t(),e(66," function, as follows:"),t(),n(67,"app-copy-button")(68,"pre")(69,"code",8),e(70,`
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
const password = 'random_password';
const hash = await bcrypt.hash(password, saltOrRounds);
`),t()()(),n(71,"p"),e(72,"To generate a salt, use the "),n(73,"code"),e(74,"genSalt"),t(),e(75," function:"),t(),n(76,"app-copy-button")(77,"pre")(78,"code",8),e(79,`
const salt = await bcrypt.genSalt();
`),t()()(),n(80,"p"),e(81,"To compare/check a password, use the "),n(82,"code"),e(83,"compare"),t(),e(84," function:"),t(),n(85,"app-copy-button")(86,"pre")(87,"code",8),e(88,`
const isMatch = await bcrypt.compare(password, hash);
`),t()()(),n(89,"p"),e(90,"You can read more about available functions "),n(91,"a",10),e(92,"here"),t(),e(93,"."),t()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return o})();var _=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-helmet"]],features:[f],decls:112,vars:0,consts:[["contentReference",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/helmet.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","helmet"],["rel","nofollow","target","_blank","href","https://github.com/helmetjs/helmet"],["rel","nofollow","target","_blank","href","https://github.com/helmetjs/helmet#how-it-works"],[1,"info"],["appAnchor","","id","use-with-express-default"],[1,"language-bash"],[1,"language-typescript"],[1,"warning"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/graphql/quick-start#apollo-sandbox"],["rel","nofollow","target","_blank","href","https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"],["appAnchor","","id","use-with-fastify"],["rel","nofollow","target","_blank","href","https://github.com/fastify/fastify-helmet"],["rel","nofollow","target","_blank","href","https://www.fastify.io/docs/latest/Reference/Plugins/"]],template:function(s,u){s&1&&(n(0,"div",1,0)(2,"div",2)(3,"a",3),r(4,"i",4),t()(),n(5,"h3",5),e(6,"Helmet"),t(),n(7,"p")(8,"a",6),e(9,"Helmet"),t(),e(10," can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately. Generally, Helmet is just a collection of smaller middleware functions that set security-related HTTP headers (read "),n(11,"a",7),e(12,"more"),t(),e(13,")."),t(),n(14,"blockquote",8)(15,"strong"),e(16,"Hint"),t(),e(17," Note that applying "),n(18,"code"),e(19,"helmet"),t(),e(20," as global or registering it must come before other calls to "),n(21,"code"),e(22,"app.use()"),t(),e(23," or setup functions that may call "),n(24,"code"),e(25,"app.use()"),t(),e(26,". This is due to the way the underlying platform (i.e., Express or Fastify) works, where the order that middleware/routes are defined matters. If you use middleware like "),n(27,"code"),e(28,"helmet"),t(),e(29," or "),n(30,"code"),e(31,"cors"),t(),e(32,` after you define a route, then that middleware will not apply to that route, it will only apply to routes defined after the middleware.
`),t(),n(33,"h4",9)(34,"span"),e(35,"Use with Express (default)"),t()(),n(36,"p"),e(37,"Start by installing the required package."),t(),n(38,"pre")(39,"code",10),e(40,`
$ npm i --save helmet
`),t()(),n(41,"p"),e(42,"Once the installation is complete, apply it as a global middleware."),t(),n(43,"app-copy-button")(44,"pre")(45,"code",11),e(46,`
import helmet from 'helmet';
// somewhere in your initialization file
app.use(helmet());
`),t()()(),n(47,"blockquote",12)(48,"strong"),e(49,"Warning"),t(),e(50," When using "),n(51,"code"),e(52,"helmet"),t(),e(53,", "),n(54,"code"),e(55,"@apollo/server"),t(),e(56," (4.x), and the "),n(57,"a",13),e(58,"Apollo Sandbox"),t(),e(59,", there may be a problem with "),n(60,"a",14),e(61,"CSP"),t(),e(62,` on the Apollo Sandbox. To solve this issue configure the CSP as shown below:
`),n(63,"app-copy-button")(64,"pre")(65,"code",11),e(66,`
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      imgSrc: [\`'self'\`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
      scriptSrc: [\`'self'\`, \`https: 'unsafe-inline'\`],
      manifestSrc: [\`'self'\`, 'apollo-server-landing-page.cdn.apollographql.com'],
      frameSrc: [\`'self'\`, 'sandbox.embed.apollographql.com'],
    },
  },
}));
`),t()()()(),n(67,"h4",15)(68,"span"),e(69,"Use with Fastify"),t()(),n(70,"p"),e(71,"If you are using the "),n(72,"code"),e(73,"FastifyAdapter"),t(),e(74,", install the "),n(75,"a",16),e(76,"@fastify/helmet"),t(),e(77," package:"),t(),n(78,"pre")(79,"code",10),e(80,`
$ npm i --save @fastify/helmet
`),t()(),n(81,"p")(82,"a",16),e(83,"fastify-helmet"),t(),e(84," should not be used as a middleware, but as a "),n(85,"a",17),e(86,"Fastify plugin"),t(),e(87,", i.e., by using "),n(88,"code"),e(89,"app.register()"),t(),e(90,":"),t(),n(91,"app-copy-button")(92,"pre")(93,"code",11),e(94,`
import helmet from '@fastify/helmet'
// somewhere in your initialization file
await app.register(helmet)
`),t()()(),n(95,"blockquote",12)(96,"strong"),e(97,"Warning"),t(),e(98," When using "),n(99,"code"),e(100,"apollo-server-fastify"),t(),e(101," and "),n(102,"code"),e(103,"@fastify/helmet"),t(),e(104,", there may be a problem with "),n(105,"a",14),e(106,"CSP"),t(),e(107,` on the GraphQL playground, to solve this collision, configure the CSP as shown below:
`),n(108,"app-copy-button")(109,"pre")(110,"code",11),e(111,`
await app.register(fastifyHelmet, {
   contentSecurityPolicy: {
     directives: {
       defaultSrc: [\`'self'\`, 'unpkg.com'],
       styleSrc: [
         \`'self'\`,
         \`'unsafe-inline'\`,
         'cdn.jsdelivr.net',
         'fonts.googleapis.com',
         'unpkg.com',
       ],
       fontSrc: [\`'self'\`, 'fonts.gstatic.com', 'data:'],
       imgSrc: [\`'self'\`, 'data:', 'cdn.jsdelivr.net'],
       scriptSrc: [
         \`'self'\`,
         \`https: 'unsafe-inline'\`,
         \`cdn.jsdelivr.net\`,
         \`'unsafe-eval'\`,
       ],
     },
   },
 });

// If you are not going to use CSP at all, you can use this:
await app.register(fastifyHelmet, {
  contentSecurityPolicy: false,
});
`),t()()()()())},dependencies:[g,E],encapsulation:2,changeDetection:0})}return o})();var O=(()=>{class o extends S{static \u0275fac=(()=>{let a;return function(u){return(a||(a=h(o)))(u||o)}})();static \u0275cmp=x({type:o,selectors:[["app-rate-limiting"]],features:[f],decls:570,vars:22,consts:[["contentReference",""],["appf115816faa9929002f2738383f44a7e9fbebf1f7",""],["app8905b1ef4c3de4692f1d1b05f86520fc9c0b7271",""],["app65e0b08d5b3308cdd04a9f8e6a35c74c4d1c61ea",""],["appb7258ed80872d03fd4f79d209f1b2cbecf86a432",""],[1,"content"],[1,"github-links"],["href","https://github.com/nestjs/docs.nestjs.com/edit/master/content/security/rate-limiting.md","aria-label","Suggest Edits","title","Suggest Edits"],[1,"fas","fa-edit"],["id","rate-limiting"],[1,"language-bash"],[1,"with-heading"],[1,"filename"],[1,"language-typescript"],["rel","nofollow","target","_blank","href","https://docs.nestjs.com/guards"],["appAnchor","","id","multiple-throttler-definitions"],["appAnchor","","id","customization"],["appAnchor","","id","proxies"],["rel","nofollow","target","_blank","href","http://expressjs.com/en/guide/behind-proxies.html"],["rel","nofollow","target","_blank","href","https://www.fastify.io/docs/latest/Reference/Server/#trustproxy"],[1,"info"],["rel","nofollow","target","_blank","href","https://expressjs.com/en/api.html#req.ips"],["rel","nofollow","target","_blank","href","https://www.fastify.io/docs/latest/Reference/Request/"],["appAnchor","","id","websockets"],["href","/security/rate-limiting#multiple-throttler-definitions"],["appAnchor","","id","graphql"],["appAnchor","","id","configuration"],["href","/security/rate-limiting#storages"],["appAnchor","","id","async-configuration"],["appAnchor","","id","storages"],["rel","nofollow","target","_blank","href","https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis"],["appAnchor","","id","time-helpers"],["appAnchor","","id","migration-guide"],[1,"Warning"],["rel","nofollow","target","_blank","href","https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#500"]],template:function(s,u){if(s&1&&(n(0,"div",5,0)(2,"div",6)(3,"a",7),r(4,"i",8),t()(),n(5,"h3",9),e(6,"Rate Limiting"),t(),n(7,"p"),e(8,"A common technique to protect applications from brute-force attacks is "),n(9,"strong"),e(10,"rate-limiting"),t(),e(11,". To get started, you'll need to install the "),n(12,"code"),e(13,"@nestjs/throttler"),t(),e(14," package."),t(),n(15,"pre")(16,"code",10),e(17,`
$ npm i --save @nestjs/throttler
`),t()(),n(18,"p"),e(19,"Once the installation is complete, the "),n(20,"code"),e(21,"ThrottlerModule"),t(),e(22," can be configured as any other Nest package with "),n(23,"code"),e(24,"forRoot"),t(),e(25," or "),n(26,"code"),e(27,"forRootAsync"),t(),e(28," methods."),t(),n(29,"app-copy-button",11)(30,"span",12),e(31),m(32,"extension"),r(33,"app-tabs",null,1),t(),n(35,"pre")(36,"code",13),e(37,`
@Module({
  imports: [
     ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(38,"p"),e(39,"The above will set the global options for the "),n(40,"code"),e(41,"ttl"),t(),e(42,", the time to live in milliseconds, and the "),n(43,"code"),e(44,"limit"),t(),e(45,", the maximum number of requests within the ttl, for the routes of your application that are guarded."),t(),n(46,"p"),e(47,"Once the module has been imported, you can then choose how you would like to bind the "),n(48,"code"),e(49,"ThrottlerGuard"),t(),e(50,". Any kind of binding as mentioned in the "),n(51,"a",14),e(52,"guards"),t(),e(53," section is fine. If you wanted to bind the guard globally, for example, you could do so by adding this provider to any module:"),t(),n(54,"app-copy-button")(55,"pre")(56,"code",13),e(57,`
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
`),t()()(),n(58,"h4",15)(59,"span"),e(60,"Multiple Throttler Definitions"),t()(),n(61,"p"),e(62,"There may come upon times where you want to set up multiple throttling definitions, like no more than 3 calls in a second, 20 calls in 10 seconds, and 100 calls in a minute. To do so, you can set up your definitions in the array with named options, that can later be referenced in the "),n(63,"code"),e(64,"@SkipThrottle()"),t(),e(65," and "),n(66,"code"),e(67,"@Throttle()"),t(),e(68," decorators to change the options again."),t(),n(69,"app-copy-button",11)(70,"span",12),e(71),m(72,"extension"),r(73,"app-tabs",null,2),t(),n(75,"pre")(76,"code",13),e(77,`
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
`),t()()(),n(78,"h4",16)(79,"span"),e(80,"Customization"),t()(),n(81,"p"),e(82,"There may be a time where you want to bind the guard to a controller or globally, but want to disable rate limiting for one or more of your endpoints. For that, you can use the "),n(83,"code"),e(84,"@SkipThrottle()"),t(),e(85," decorator, to negate the throttler for an entire class or a single route. The "),n(86,"code"),e(87,"@SkipThrottle()"),t(),e(88," decorator can also take in an object of string keys with boolean values for if there is a case where you want to exclude "),n(89,"em"),e(90,"most"),t(),e(91," of a controller, but not every route, and configure it per throttler set if you have more than one. If you do not pass an object, the default is to use "),n(92,"code"),e(93),t()(),n(94,"app-copy-button")(95,"pre")(96,"code",13),e(97,`
@SkipThrottle()
@Controller('users')
export class UsersController {}
`),t()()(),n(98,"p"),e(99,"This "),n(100,"code"),e(101,"@SkipThrottle()"),t(),e(102," decorator can be used to skip a route or a class or to negate the skipping of a route in a class that is skipped."),t(),n(103,"app-copy-button")(104,"pre")(105,"code",13),e(106,`
@SkipThrottle()
@Controller('users')
export class UsersController {
  // Rate limiting is applied to this route.
  @SkipThrottle({ default: false })
  dontSkip() {
    return 'List users work with Rate limiting.';
  }
  // This route will skip rate limiting.
  doSkip() {
    return 'List users work without Rate limiting.';
  }
}
`),t()()(),n(107,"p"),e(108,"There is also the "),n(109,"code"),e(110,"@Throttle()"),t(),e(111," decorator which can be used to override the "),n(112,"code"),e(113,"limit"),t(),e(114," and "),n(115,"code"),e(116,"ttl"),t(),e(117," set in the global module, to give tighter or looser security options. This decorator can be used on a class or a function as well. With version 5 and onwards, the decorator takes in an object with the string relating to the name of the throttler set, and an object with the limit and ttl keys and integer values, similar to the options passed to the root module. If you do not have a name set in your original options, use the string "),n(118,"code"),e(119,"default"),t(),e(120,". You have to configure it like this:"),t(),n(121,"app-copy-button")(122,"pre")(123,"code",13),e(124,`
// Override default configuration for Rate limiting and duration.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "List users works with custom rate limiting.";
}
`),t()()(),n(125,"h4",17)(126,"span"),e(127,"Proxies"),t()(),n(128,"p"),e(129,"If your application is running behind a proxy server, it\u2019s essential to configure the HTTP adapter to trust the proxy. You can refer to the specific HTTP adapter options for "),n(130,"a",18),e(131,"Express"),t(),e(132," and "),n(133,"a",19),e(134,"Fastify"),t(),e(135," to enable the "),n(136,"code"),e(137,"trust proxy"),t(),e(138," setting."),t(),n(139,"p"),e(140,"Here's an example that demonstrates how to enable "),n(141,"code"),e(142,"trust proxy"),t(),e(143," for the Express adapter:"),t(),n(144,"app-copy-button",11)(145,"span",12),e(146),m(147,"extension"),r(148,"app-tabs",null,3),t(),n(150,"pre")(151,"code",13),e(152,`
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
`),t()(),n(153,"pre")(154,"code",13),e(155,`
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.set('trust proxy', 'loopback'); // Trust requests from the loopback address
  await app.listen(3000);
}

bootstrap();
`),t()()(),n(156,"p"),e(157,"Enabling "),n(158,"code"),e(159,"trust proxy"),t(),e(160," allows you to retrieve the original IP address from the "),n(161,"code"),e(162,"X-Forwarded-For"),t(),e(163," header. You can also customize the behavior of your application by overriding the "),n(164,"code"),e(165,"getTracker()"),t(),e(166," method to extract the IP address from this header instead of relying on "),n(167,"code"),e(168,"req.ip"),t(),e(169,". The following example demonstrates how to achieve this for both Express and Fastify:"),t(),n(170,"app-copy-button",11)(171,"span",12),e(172),m(173,"extension"),r(174,"app-tabs",null,4),t(),n(176,"pre")(177,"code",13),e(178,`
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // individualize IP extraction to meet your own needs
  }
}
`),t()()(),n(179,"blockquote",20)(180,"strong"),e(181,"Hint"),t(),e(182," You can find the API of the "),n(183,"code"),e(184,"req"),t(),e(185," Request object for express "),n(186,"a",21),e(187,"here"),t(),e(188," and for fastify "),n(189,"a",22),e(190,"here"),t(),e(191,`.
`),t(),n(192,"h4",23)(193,"span"),e(194,"Websockets"),t()(),n(195,"p"),e(196,"This module can work with websockets, but it requires some class extension. You can extend the "),n(197,"code"),e(198,"ThrottlerGuard"),t(),e(199," and override the "),n(200,"code"),e(201,"handleRequest"),t(),e(202," method like so:"),t(),n(203,"app-copy-button")(204,"pre")(205,"code",13),e(206,`
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;

    const client = context.switchToWs().getClient();
    const tracker = client._socket.remoteAddress;
    const key = generateKey(context, tracker, throttler.name);
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler.name,
      );

    const getThrottlerSuffix = (name: string) =>
      name === 'default' ? '' : \`-\${name}\`;

    // Throw an error when the user reached their limit.
    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      });
    }

    return true;
  }
}
`),t()()(),n(207,"blockquote",20)(208,"strong"),e(209,"Hint"),t(),e(210," If you are using ws, it is necessary to replace the "),n(211,"code"),e(212,"_socket"),t(),e(213," with "),n(214,"code"),e(215,"conn"),t()(),n(216,"p"),e(217,"There's a few things to keep in mind when working with WebSockets:"),t(),n(218,"ul")(219,"li"),e(220,"Guard cannot be registered with the "),n(221,"code"),e(222,"APP_GUARD"),t(),e(223," or "),n(224,"code"),e(225,"app.useGlobalGuards()"),t()(),n(226,"li"),e(227,"When a limit is reached, Nest will emit an "),n(228,"code"),e(229,"exception"),t(),e(230," event, so make sure there is a listener ready for this"),t()(),n(231,"blockquote",20)(232,"strong"),e(233,"Hint"),t(),e(234," If you are using the "),n(235,"code"),e(236,"@nestjs/platform-ws"),t(),e(237," package you can use "),n(238,"code"),e(239,"client._socket.remoteAddress"),t(),e(240,` instead.
`),t(),n(241,"blockquote",20)(242,"strong"),e(243,"Hint"),t(),e(244," When you configure "),n(245,"a",24),e(246,"multiple throttler definitions"),t(),e(247,", "),n(248,"code"),e(249,"handleRequest()"),t(),e(250," runs once for each throttler set. Use the "),n(251,"code"),e(252,"throttler.name"),t(),e(253," from "),n(254,"code"),e(255,"ThrottlerRequest"),t(),e(256," when generating the storage key and when reporting the "),n(257,"code"),e(258,"ThrottlerLimitDetail"),t(),e(259,`, as shown above, so each named throttler tracks its own limit.
`),t(),n(260,"h4",25)(261,"span"),e(262,"GraphQL"),t()(),n(263,"p"),e(264,"The "),n(265,"code"),e(266,"ThrottlerGuard"),t(),e(267," can also be used to work with GraphQL requests. Again, the guard can be extended, but this time the "),n(268,"code"),e(269,"getRequestResponse"),t(),e(270," method will be overridden"),t(),n(271,"app-copy-button")(272,"pre")(273,"code",13),e(274,`
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
`),t()()(),n(275,"h4",26)(276,"span"),e(277,"Configuration"),t()(),n(278,"p"),e(279,"The following options are valid for the object passed to the array of the "),n(280,"code"),e(281,"ThrottlerModule"),t(),e(282,"'s options:"),t(),n(283,"table")(284,"tr")(285,"td")(286,"code"),e(287,"name"),t()(),n(288,"td"),e(289,"the name for internal tracking of which throttler set is being used. Defaults to "),n(290,"code"),e(291,"default"),t(),e(292," if not passed"),t()(),n(293,"tr")(294,"td")(295,"code"),e(296,"ttl"),t()(),n(297,"td"),e(298,"the number of milliseconds that each request will last in storage"),t()(),n(299,"tr")(300,"td")(301,"code"),e(302,"limit"),t()(),n(303,"td"),e(304,"the maximum number of requests within the TTL limit"),t()(),n(305,"tr")(306,"td")(307,"code"),e(308,"blockDuration"),t()(),n(309,"td"),e(310,"the number of milliseconds that request will be blocked for that time"),t()(),n(311,"tr")(312,"td")(313,"code"),e(314,"ignoreUserAgents"),t()(),n(315,"td"),e(316,"an array of regular expressions of user-agents to ignore when it comes to throttling requests"),t()(),n(317,"tr")(318,"td")(319,"code"),e(320,"skipIf"),t()(),n(321,"td"),e(322,"a function that takes in the "),n(323,"code"),e(324,"ExecutionContext"),t(),e(325," and returns a "),n(326,"code"),e(327,"boolean"),t(),e(328," to short circuit the throttler logic. Like "),n(329,"code"),e(330,"@SkipThrottle()"),t(),e(331,", but based on the request"),t()()(),n(332,"p"),e(333,"If you need to set up storage instead, or want to use some of the above options in a more global sense, applying to each throttler set, you can pass the options above via the "),n(334,"code"),e(335,"throttlers"),t(),e(336," option key and use the below table"),t(),n(337,"table")(338,"tr")(339,"td")(340,"code"),e(341,"storage"),t()(),n(342,"td"),e(343,"a custom storage service for where the throttling should be kept track. "),n(344,"a",27),e(345,"See here."),t()()(),n(346,"tr")(347,"td")(348,"code"),e(349,"ignoreUserAgents"),t()(),n(350,"td"),e(351,"an array of regular expressions of user-agents to ignore when it comes to throttling requests"),t()(),n(352,"tr")(353,"td")(354,"code"),e(355,"skipIf"),t()(),n(356,"td"),e(357,"a function that takes in the "),n(358,"code"),e(359,"ExecutionContext"),t(),e(360," and returns a "),n(361,"code"),e(362,"boolean"),t(),e(363," to short circuit the throttler logic. Like "),n(364,"code"),e(365,"@SkipThrottle()"),t(),e(366,", but based on the request"),t()(),n(367,"tr")(368,"td")(369,"code"),e(370,"throttlers"),t()(),n(371,"td"),e(372,"an array of throttler sets, defined using the table above"),t()(),n(373,"tr")(374,"td")(375,"code"),e(376,"errorMessage"),t()(),n(377,"td"),e(378,"a "),n(379,"code"),e(380,"string"),t(),e(381," OR a function that takes in the "),n(382,"code"),e(383,"ExecutionContext"),t(),e(384," and the "),n(385,"code"),e(386,"ThrottlerLimitDetail"),t(),e(387," and returns a "),n(388,"code"),e(389,"string"),t(),e(390," which overrides the default throttler error message"),t()(),n(391,"tr")(392,"td")(393,"code"),e(394,"getTracker"),t()(),n(395,"td"),e(396,"a function that takes in the "),n(397,"code"),e(398,"Request"),t(),e(399," and returns a "),n(400,"code"),e(401,"string"),t(),e(402," to override the default logic of the "),n(403,"code"),e(404,"getTracker"),t(),e(405," method"),t()(),n(406,"tr")(407,"td")(408,"code"),e(409,"generateKey"),t()(),n(410,"td"),e(411,"a function that takes in the "),n(412,"code"),e(413,"ExecutionContext"),t(),e(414,", the tacker "),n(415,"code"),e(416,"string"),t(),e(417," and the throttler name as a "),n(418,"code"),e(419,"string"),t(),e(420," and returns a "),n(421,"code"),e(422,"string"),t(),e(423," to override the final key which will be used to store the rate limit value. This overrides the default logic of the "),n(424,"code"),e(425,"generateKey"),t(),e(426," method"),t()()(),n(427,"h4",28)(428,"span"),e(429,"Async Configuration"),t()(),n(430,"p"),e(431,"You may want to get your rate-limiting configuration asynchronously instead of synchronously. You can use the "),n(432,"code"),e(433,"forRootAsync()"),t(),e(434," method, which allows for dependency injection and "),n(435,"code"),e(436,"async"),t(),e(437," methods."),t(),n(438,"p"),e(439,"One approach would be to use a factory function:"),t(),n(440,"app-copy-button")(441,"pre")(442,"code",13),e(443,`
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
})
export class AppModule {}
`),t()()(),n(444,"p"),e(445,"You can also use the "),n(446,"code"),e(447,"useClass"),t(),e(448," syntax:"),t(),n(449,"app-copy-button")(450,"pre")(451,"code",13),e(452,`
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
  ],
})
export class AppModule {}
`),t()()(),n(453,"p"),e(454,"This is doable, as long as "),n(455,"code"),e(456,"ThrottlerConfigService"),t(),e(457," implements the interface "),n(458,"code"),e(459,"ThrottlerOptionsFactory"),t(),e(460,"."),t(),n(461,"h4",29)(462,"span"),e(463,"Storages"),t()(),n(464,"p"),e(465,"The built in storage is an in memory cache that keeps track of the requests made until they have passed the TTL set by the global options. You can drop in your own storage option to the "),n(466,"code"),e(467,"storage"),t(),e(468," option of the "),n(469,"code"),e(470,"ThrottlerModule"),t(),e(471," so long as the class implements the "),n(472,"code"),e(473,"ThrottlerStorage"),t(),e(474," interface."),t(),n(475,"p"),e(476,"For distributed servers you could use the community storage provider for "),n(477,"a",30),e(478,"Redis"),t(),e(479," to have a single source of truth."),t(),n(480,"blockquote",20)(481,"strong"),e(482,"Note"),t(),n(483,"code"),e(484,"ThrottlerStorage"),t(),e(485," can be imported from "),n(486,"code"),e(487,"@nestjs/throttler"),t(),e(488,`.
`),t(),n(489,"h4",31)(490,"span"),e(491,"Time Helpers"),t()(),n(492,"p"),e(493,"There are a couple of helper methods to make the timings more readable if you prefer to use them over the direct definition. "),n(494,"code"),e(495,"@nestjs/throttler"),t(),e(496," exports five different helpers, "),n(497,"code"),e(498,"seconds"),t(),e(499,", "),n(500,"code"),e(501,"minutes"),t(),e(502,", "),n(503,"code"),e(504,"hours"),t(),e(505,", "),n(506,"code"),e(507,"days"),t(),e(508,", and "),n(509,"code"),e(510,"weeks"),t(),e(511,". To use them, simply call "),n(512,"code"),e(513,"seconds(5)"),t(),e(514," or any of the other helpers, and the correct number of milliseconds will be returned."),t(),n(515,"h4",32)(516,"span"),e(517,"Migration Guide"),t()(),n(518,"p"),e(519,"For most people, wrapping your options in an array will be enough."),t(),n(520,"p"),e(521,"If you are using a custom storage, you should wrap your "),n(522,"code"),e(523,"ttl"),t(),e(524," and "),n(525,"code"),e(526,"limit"),t(),e(527,` in an
array and assign it to the `),n(528,"code"),e(529,"throttlers"),t(),e(530," property of the options object."),t(),n(531,"p"),e(532,"Any "),n(533,"code"),e(534,"@SkipThrottle()"),t(),e(535," decorator can be used to bypass throttling for specific routes or methods. It accepts an optional boolean parameter, which defaults to "),n(536,"code"),e(537,"true"),t(),e(538,". This is useful when you want to skip rate limiting on particular endpoints."),t(),n(539,"p"),e(540,"Any "),n(541,"code"),e(542,"@Throttle()"),t(),e(543,` decorators should also now take in an object with string keys,
relating to the names of the throttler contexts (again, `),n(544,"code"),e(545,"'default'"),t(),e(546,` if no name)
and values of objects that have `),n(547,"code"),e(548,"limit"),t(),e(549," and "),n(550,"code"),e(551,"ttl"),t(),e(552," keys."),t(),n(553,"blockquote",33)(554,"strong"),e(555,"Important"),t(),e(556," The "),n(557,"code"),e(558,"ttl"),t(),e(559," is now in "),n(560,"strong"),e(561,"milliseconds"),t(),e(562,`. If you want to keep your ttl
in seconds for readability, use the `),n(563,"code"),e(564,"seconds"),t(),e(565,` helper from this package. It just
multiplies the ttl by 1000 to make it in milliseconds.
`),t(),n(566,"p"),e(567,"For more info, see the "),n(568,"a",34),e(569,"Changelog"),t()()()),s&2){let v=d(34),b=d(74),y=d(149),w=d(175);i(31),c(" ",p(32,10,"app.module",v.isJsActive),`
`),i(40),c(" ",p(72,13,"app.module",b.isJsActive),`
`),i(22),D("","{"," default: true ","}"),i(53),c(" ",p(147,16,"main",y.isJsActive),`
`),i(4),l("hide",y.isJsActive),i(3),l("hide",!y.isJsActive),i(19),c(" ",p(173,19,"throttler-behind-proxy.guard",w.isJsActive),`
`)}},dependencies:[E,A,g,k],encapsulation:2,changeDetection:0})}return o})();var Me=[{path:"authentication",component:M,data:{title:"Authentication"}},{path:"cors",component:U,data:{title:"CORS"}},{path:"helmet",component:_,data:{title:"Helmet"}},{path:"encryption-and-hashing",component:F,data:{title:"Encryption and Hashing"}},{path:"csrf",component:J,data:{title:"CSRF"}},{path:"rate-limiting",component:O,data:{title:"Rate Limiting"}},{path:"authorization",component:H,data:{title:"Authorization"}}];export{Me as SECURITY_ROUTES};
