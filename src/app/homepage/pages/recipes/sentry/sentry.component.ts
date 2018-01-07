import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-sentry',
  templateUrl: './sentry.component.html',
  styleUrls: ['./sentry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SentryComponent extends BasePageComponent {

  get dependencies(): string {
    return `
$ npm install --save raven
$ npm install --save-dev @types/raven`;
  }

  get expressExample(): string {
    return `
var app = require('express')();
var Raven = require('raven');

// Must configure Raven before doing anything else with it
Raven.config('__DSN__').install();

// The request handler must be the first middleware on the app
app.use(Raven.requestHandler());

app.get('/', function mainHandler(req, res) {
    throw new Error('Broke!');
});

// The error handler must be before any other error middleware
app.use(Raven.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
    // The error id is attached to \`res.sentry\` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\\n');
});

app.listen(3000);`;
  }

  get sentryInterceptor () {
    return `
import {ExecutionContext, NestInterceptor} from "@nestjs/common";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/throw';
import * as Raven from 'raven';

@Interceptor()
class SentryInterceptor implements NestInterceptor {
  intercept(dataOrRequest, context: ExecutionContext, stream$: Observable<any>): Observable<any> {
    return stream$.catch(err => {
      Raven.captureException(err);
      return Observable.throw(err);
    });
  }
};`;
  }

  get server () {
    return `
import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from "@nestjs/common";
import * as Raven from 'raven';
import {ApplicationModule} from './app/app.module';
import {SentryInterceptor} from "./app/shared/interceptors/sentry.interceptor";

const isRavenEnabled = process.env.hasOwnProperty('SENTRY_DSN');

const bootstrap = async () => {

  if (isRavenEnabled) Raven.config(process.env.SENTRY_DSN).install();
  const app = await NestFactory.create(ApplicationModule);
  if (isRavenEnabled) app.use(Raven.requestHandler());
  app.useGlobalPipes(new ValidationPipe());
  if (isRavenEnabled) app.useGlobalInterceptors(new SentryInterceptor());
  await app.listen(3000);
  console.log(\`Application is listening on port 3000\`);

};

bootstrap();`;
  }

}
