import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-mvc',
  templateUrl: './mvc.component.html',
  styleUrls: ['./mvc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MvcComponent extends BasePageComponent {
  get main() {
    return `
import * as express from 'express';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);

  app.use(express.static(path.join(__dirname, 'public')));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  await app.listen(3000);
}
bootstrap();
`;
  }

  get index() {
    return `
html
head
body
  p= message`;
  }

  get root() {
    return `
@Get()
root(@Res() res) {
  res.render('index', { message: 'Hello world!' });
}`;
  }

  get rootJs() {
    return `
@Get()
@Bind(Res())
root(res) {
  res.render('index', { message: 'Hello world!' });
}`;
  }
}
